import { Component, EventEmitter, Output, Input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropDirective } from '../../../../shared/directives';
import { FileValidationService } from '../../../../core/services/file-validation.service';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';
import { TaskAttachment } from '../../../../core/models/task.interface';
import { formatFileSize } from '../../../../shared/utils';

/**
 * Component for uploading and managing task attachments
 * Supports drag & drop and file picker for JPEG/PNG images
 */
@Component({
  selector: 'app-task-attachment-upload',
  standalone: true,
  imports: [CommonModule, DragDropDirective],
  templateUrl: './task-attachment-upload.component.html',
  styleUrl: './task-attachment-upload.component.scss'
})
export class TaskAttachmentUploadComponent {
  private fileValidation = inject(FileValidationService);
  private imageCompression = inject(ImageCompressionService);
  private hasInitialized = false;

  @Input() set initialAttachments(attachments: TaskAttachment[] | undefined) {
    if (!this.hasInitialized && attachments && attachments.length > 0) {
      this.attachments.set([...attachments]);
      this.hasInitialized = true;
    }
  }

  @Output() attachmentsChange = new EventEmitter<TaskAttachment[]>();

  attachments = signal<TaskAttachment[]>([]);
  errorMessage = signal<string | null>(null);

  /**
   * Handle files dropped via DragDropDirective
   * @param files - Array of dropped files
   */
  async handleFilesDropped(files: File[]): Promise<void> {
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

    for (const file of files) {
      await this.processFile(file);
    }
  }

  /**
   * Process single file with validation and compression
   * @param file - File to process
   * @remarks
   * Validates the file using FileValidationService.
   * If valid, compresses the image using ImageCompressionService.
   * Creates a TaskAttachment object and adds it to the attachments list.
   * Emits the updated attachments list via attachmentsChange event emitter.
   */
  private async processFile(file: File): Promise<void> {
    const validation = await this.fileValidation.validateFile(file);
    
    if (!validation.valid) {
      this.errorMessage.set(validation.error || 'Invalid file');
      return;
    }

    try {
      const base64 = await this.imageCompression.compressImage(file);
      
      const attachment: TaskAttachment = {
        id: this.generateId(),
        filename: file.name,
        fileType: file.type as 'image/jpeg' | 'image/png',
        base64,
        size: file.size,
        uploadedAt: new Date()
      };

      this.attachments.update(current => [...current, attachment]);
      this.attachmentsChange.emit(this.attachments());
    } catch (error) {
      this.errorMessage.set('Failed to process image');
      console.error('Image processing error:', error);
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
