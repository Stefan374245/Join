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
   * @returns {void}
    * @remarks
    * This method orchestrates the processing of multiple files by first checking if the upload can start based on the current limits and then applying those limits to the provided files. It iterates over each file and processes it individually, ensuring that all necessary validations and transformations are applied before adding them to the attachments list.
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

  /**
   * Checks if the upload process can start based on the provided files and current attachment limits.
   * @param files - Array of files to be uploaded
   * @returns {boolean} Returns `true` if the upload can proceed; otherwise, returns `false` and shows appropriate error messages.
    * @remarks
    * Validates that there are files to upload and that adding them would not exceed the total attachment limit.
    * If the limits are exceeded, it shows error messages and prevents the upload from starting.
   */
  private canStart(files: File[]): boolean {
    if (files.length === 0) return false;
    if (!this.isAtLimit()) return true;

    this.notifyLimitAndFlash(`Limit total ${this.maxFilesTotal}. Remove one image to add more.`);
    return false;
  }

  /**
   * Applies upload limits to the provided files.
   * @param files - Array of files to be uploaded
   * @returns {File[]} Array of files after applying limits
   * @remarks Applies per-upload and total slot limits to the provided files.
   */
  private applyLimits(files: File[]): File[] {
    const withinPerUploadLimit = this.limitPerUpload(files);
    return this.limitBySlots(withinPerUploadLimit);
  }

  /**
   * Limits the number of files per upload.
   * @param files - Array of files to be uploaded
   * @returns {File[]} Array of files after applying per-upload limit
   * @remarks Ensures that the number of files does not exceed the maximum allowed per upload.
   */
  private limitPerUpload(files: File[]): File[] {
    if (files.length <= this.maxFilesPerUpload) return files;

    this.notifyLimitAndFlash(`You can upload max ${this.maxFilesPerUpload} images at once. Limit total ${this.maxFilesTotal}.`);
    return files.slice(0, this.maxFilesPerUpload);
  }

  /**
   * Limits the number of files based on available slots.
   * @param files - Array of files to be uploaded
   * @returns {File[]} Array of files after applying slot limits
   * @remarks Ensures that the number of files does not exceed the available slots.
   */
  private limitBySlots(files: File[]): File[] {
    const availableSlots = this.remainingSlots();
    if (files.length <= availableSlots) return files;

    this.notifyLimitAndFlash(`Limit total ${this.maxFilesTotal}. Only ${availableSlots} slot(s) left.`);
    return files.slice(0, availableSlots);
  }

  /**
   * Process single file with validation and compression
   * @param file - File to process
   * @return {void}
   * @remarks This method handles the processing of a single file by first attempting to compress it using the `ImageUploadFlowService`. If the compression is successful, it creates a `TaskAttachment` object and validates its size against the total attachments size limit. If the attachment is valid, it is added to the attachments list. If any errors occur during processing, an appropriate error message is set to inform the user. This method ensures that only valid and appropriately sized attachments are added to the task.
   */
  private async processFile(file: File): Promise<void> {
    try {
      const img = await this.imgFlow.proc(file);
      const attachment = this.createAttachment(file, img);
      
      if (!this.validateSize(attachment)) return;
      
      this.addAttachment(attachment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process image';
      this.errorMessage.set(message);
    }
  }

  /**
   * Download file as blob (primary strategy)
   * @param file - File to download
   * @param img - Compressed image data
   * @returns {Promise<string>} Download URL of the uploaded file
   * @remarks This method attempts to upload the compressed image data to Firebase Storage and retrieve a download URL. It uses the `AttachmentStorageService` to handle the upload and download URL retrieval. If the upload is successful, it returns the download URL, which can be used for downloading the file or displaying it in the UI. If any errors occur during this process, they are propagated to be handled by the calling method.
   */
  private createAttachment(file: File, img: { fileType: string; base64: string }): TaskAttachment {
    return {
      id: this.generateId(),
      filename: file.name,
      fileType: img.fileType,
      base64: img.base64,
      size: calculateBase64Size(img.base64),
      uploadedAt: new Date()
    };
  }

  /**
   * Validates the size of a task attachment against the total allowed size.
   * @param attachment - The task attachment to validate.
   * @returns {boolean} True if the attachment size is within the allowed limit, false otherwise.
   * @remarks This method calculates the new total size if the attachment were to be added. If the new total size exceeds the maximum allowed size, it sets an error message and shows a toast notification. This ensures that the total size of all attachments does not exceed the defined limit.
   */
  private validateSize(attachment: TaskAttachment): boolean {
    const newTotalSize = this.totalSize() + calculateBase64Size(attachment.base64);
    if (newTotalSize <= this.maxTotalSize) return true;

    const exceededBy = formatFileSize(newTotalSize - this.maxTotalSize);
    this.errorMessage.set(`Cannot add image: Would exceed 1MB total limit by ${exceededBy}`);
    this.toastService.showError(`Upload limit: 1MB total for all images. This would exceed by ${exceededBy}`);
    return false;
  }

  /**
   * Check if compressed image exceeds size limit and throw error if it does
   * @param attachment - The task attachment to validate
   * @return {boolean} - Returns `true` if the attachment size is within the allowed limit, otherwise returns `false` and sets an error message.
   * @remarks This method calculates the new total size if the attachment were to be added. If the new total size exceeds the maximum allowed size, it sets an error message and shows a toast notification. This ensures that the total size of all attachments does not exceed the defined limit.
   */
  private addAttachment(attachment: TaskAttachment): void {
    this.attachments.update(current => [...current, attachment]);
    this.attachmentsChange.emit(this.attachments());
  }

  /**
   * Removes an attachment from the attachments list by its unique identifier.
   * @param id - The unique identifier of the attachment to be removed.
   * @return {void}
   * @remarks This method updates the attachments signal by filtering out the attachment with the specified ID. After updating the attachments list, it emits the updated list through the `attachmentsChange` event emitter to notify parent components of the change.
   */
  removeAttachment(id: string): void {
    this.attachments.update(current => 
      current.filter(att => att.id !== id)
    );
    this.attachmentsChange.emit(this.attachments());
  }

  /**
   * Removes all attachments from the current list.
   * @return {void}
   * @remarks This method clears the attachments list by setting it to an empty array and emits the change through the `attachmentsChange` event emitter. This allows parent components to react to the removal of all attachments, such as updating the UI or resetting related states.
   */
  removeAllAttachments(): void {
    this.attachments.set([]);
    this.attachmentsChange.emit([]);
  }

  /**
   * Generate unique ID for attachment
   * @return {string} Unique ID string
   * @remarks This method generates a unique identifier by combining the current timestamp with a random string. This ensures that each attachment has a distinct ID, which is crucial for managing attachments, especially when adding or removing them from the list. The generated ID is used to track attachments and perform operations like deletion without conflicts.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify user about limit issues and flash the limit hint
   * @param message - The message to display in the toast notification
   * @returns {void}
   * @remarks Shows an error toast with the provided message and triggers a flash effect on the limit hint. If the flash effect is already active, it does not reset the timer to allow for continuous flashing if multiple limit issues occur in quick succession.
   */
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
   * @returns {string} Data URL for image preview
   * @remarks Returns the download URL if available; otherwise, constructs a data URL from the base64 string for previewing the image.
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    if (!attachment.base64) {
      return '';
    }
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

  /**
   * Format file size for display (using shared utility)
   * @param bytes - File size in bytes
   * @returns {string} Formatted file size string
   */
  formatFileSize = formatFileSize;

  /**
   * Gets the correct file size for an attachment, always calculated from base64
   * @param attachment - The task attachment
   * @returns {number} - The actual size in bytes based on the compressed base64 data
   * @remarks This method ensures that the displayed size is always correct by calculating it from the base64 string.
   */
  getAttachmentSize(attachment: TaskAttachment): number {
    return calculateBase64Size(attachment.base64);
  }
}
