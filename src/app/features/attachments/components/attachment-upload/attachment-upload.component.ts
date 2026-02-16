import { Component, EventEmitter, Output, Input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropDirective } from '../../../../shared/directives';
import { ImageUploadFlowService } from '../../services/image-upload-flow.service';
import { TaskAttachment } from '../../../../core/models/task.interface';
import { formatFileSize, calculateTotalAttachmentsSize, calculateBase64Size, FILE_UPLOAD } from '../../../../shared/constants';
import { ToastService } from '../../../../core/services/toast.service';
/**
 * Component for uploading and managing task attachments
 * Supports drag & drop and file picker for JPEG/PNG images
 */
@Component({
  selector: 'app-attachment-upload',
  standalone: true,
  imports: [CommonModule, DragDropDirective],
  templateUrl: './attachment-upload.component.html',
  styleUrl: './attachment-upload.component.scss'
})
export class AttachmentUploadComponent {
  private imgFlow = inject(ImageUploadFlowService);
  private toastService = inject(ToastService);
  private hasInitialized = false;
  private limitHintFlashTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly maxFilesPerUpload = FILE_UPLOAD.MAX_FILES_PER_UPLOAD;
  readonly maxFilesTotal = FILE_UPLOAD.MAX_FILES_TOTAL;
  readonly maxTotalSize = FILE_UPLOAD.MAX_TOTAL_ATTACHMENTS_SIZE;

  @Input() set initialAttachments(attachments: TaskAttachment[] | undefined) {
    if (!this.hasInitialized && attachments && attachments.length > 0) {
      const limitedAttachments = attachments.slice(0, this.maxFilesTotal);
      this.attachments.set([...limitedAttachments]);
      if (attachments.length > this.maxFilesTotal) {
        this.errorMessage.set(`Only ${this.maxFilesTotal} images are allowed in total.`);
      }
      this.hasInitialized = true;
    }
  }

  @Output() attachmentsChange = new EventEmitter<TaskAttachment[]>();

  attachments = signal<TaskAttachment[]>([]);
  errorMessage = signal<string | null>(null);
  isDragOver = signal<boolean>(false);
  isLimitHintFlashing = signal<boolean>(false);
  isAtLimit = computed(() => this.attachments().length >= this.maxFilesTotal);
  remainingSlots = computed(() => Math.max(0, this.maxFilesTotal - this.attachments().length));
  
  totalSize = computed(() => calculateTotalAttachmentsSize(this.attachments()));
  
  totalSizeFormatted = computed(() => formatFileSize(this.totalSize()));
  
  isOverSizeLimit = computed(() => this.totalSize() > this.maxTotalSize);

  /**
   * Handle drag over event
   * @param event - DragEvent
   * @remarks
   * Prevents default behavior and sets drag over state to true for visual feedback.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isAtLimit()) {
      return;
    }
    this.isDragOver.set(true);
  }

  /**
   * Handle drag leave event
   * @param _event - DragEvent
   * @remarks
   * Sets drag over state to false to remove visual feedback when dragging leaves the drop area.
   */
  onDragLeave(_event: DragEvent): void {
    this.isDragOver.set(false);
  }

  /**
   * Handle files dropped via DragDropDirective
   * @param files - Array of dropped files
   * @remarks
   * Resets drag over state and processes the dropped files.
   */
  async handleFilesDropped(files: File[]): Promise<void> {
    this.isDragOver.set(false);
    if (this.isAtLimit()) {
      this.notifyLimitAndFlash(`Limit total ${this.maxFilesTotal}. Remove one image to add more.`);
      return;
    }
    await this.processFiles(files);
  }

  /**
   * Handle file selection from input
   * @param event - File input change event
   * @remarks
   * Processes selected files and resets input value to allow re-selection of the same file.
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files) {
      await this.processFiles(Array.from(files));
      input.value = '';
    }
  }

  /**
   * Process multiple files
   * @param files - Array of files to process
   * @remarks
   * Iterates over each file and processes it individually.
   */
  private async processFiles(files: File[]): Promise<void> {
    this.errorMessage.set(null);

    if (!this.canStart(files)) return;

    const filesToProcess = this.applyLimits(files);
    for (const file of filesToProcess) {
      await this.processFile(file);
    }
  }

  private canStart(files: File[]): boolean {
    if (files.length === 0) return false;
    if (!this.isAtLimit()) return true;

    this.notifyLimitAndFlash(`Limit total ${this.maxFilesTotal}. Remove one image to add more.`);
    return false;
  }

  private applyLimits(files: File[]): File[] {
    const withinPerUploadLimit = this.limitPerUpload(files);
    return this.limitBySlots(withinPerUploadLimit);
  }

  private limitPerUpload(files: File[]): File[] {
    if (files.length <= this.maxFilesPerUpload) return files;

    this.notifyLimitAndFlash(`You can upload max ${this.maxFilesPerUpload} images at once. Limit total ${this.maxFilesTotal}.`);
    return files.slice(0, this.maxFilesPerUpload);
  }

  private limitBySlots(files: File[]): File[] {
    const availableSlots = this.remainingSlots();
    if (files.length <= availableSlots) return files;

    this.notifyLimitAndFlash(`Limit total ${this.maxFilesTotal}. Only ${availableSlots} slot(s) left.`);
    return files.slice(0, availableSlots);
  }

  /**
   * Process single file with validation and compression
   * @param file - File to process
   * @remarks
   * Validates the file using FileValidationService.
   * If valid, compresses the image using ImageCompressionService.
   * Creates a TaskAttachment object and adds it to the attachments list.
   * Emits the updated attachments list via attachmentsChange event emitter.
   * Validates 1MB total size limit for all attachments.
   */
  private async processFile(file: File): Promise<void> {
    try {
      const img = await this.imgFlow.proc(file);
      const attachment = { 
        id: this.generateId(), 
        filename: file.name, 
        fileType: img.fileType, 
        base64: img.base64, 
        size: file.size, 
        uploadedAt: new Date() 
      };
      
      // Check if adding this attachment would exceed 1MB total limit
      const newTotalSize = this.totalSize() + calculateBase64Size(attachment.base64);
      if (newTotalSize > this.maxTotalSize) {
        const exceededBy = formatFileSize(newTotalSize - this.maxTotalSize);
        this.errorMessage.set(`Cannot add image: Would exceed 1MB total limit by ${exceededBy}`);
        this.toastService.showError(`Upload limit: 1MB total for all images. This would exceed by ${exceededBy}`);
        return;
      }
      
      this.attachments.update(current => [...current, attachment]);
      this.attachmentsChange.emit(this.attachments());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process image';
      this.errorMessage.set(message);
    }
  }

  /**
   * Removes an attachment from the attachments list by its unique identifier.
   *
   * @param id - The unique identifier of the attachment to be removed.
   * @remarks
   * This method updates the attachments list by filtering out the attachment with the specified `id`.
   * After updating the list, it emits the updated attachments through the `attachmentsChange` event emitter.
   */
  removeAttachment(id: string): void {
    this.attachments.update(current => 
      current.filter(att => att.id !== id)
    );
    this.attachmentsChange.emit(this.attachments());
  }

  /**
   * Removes all attachments from the current list.
   * 
   * This method clears the attachments by setting the attachments array to an empty array.
   * It also emits an empty array via the `attachmentsChange` event to notify any listeners
   * that all attachments have been removed.
   */
  removeAllAttachments(): void {
    this.attachments.set([]);
    this.attachmentsChange.emit([]);
  }

  /**
   * Generate unique ID for attachment
   * @return Unique ID string
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyLimitAndFlash(message: string): void {
    this.toastService.showError(message, 3500);

    if (this.isLimitHintFlashing()) {
      return;
    }

    this.isLimitHintFlashing.set(true);
    this.limitHintFlashTimeout = setTimeout(() => {
      this.isLimitHintFlashing.set(false);
      this.limitHintFlashTimeout = null;
    }, 2000);
  }

  /**
   * Get data URL for preview
   * @param attachment - Task attachment
   * @returns Preview URL string
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

  /**
   * Format file size for display (using shared utility)
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize = formatFileSize;
}
