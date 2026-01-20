import { Component, EventEmitter, Output, Input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileValidationService } from '../../../../core/services/file-validation.service';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';
import { TaskAttachment } from '../../../../core/models/task.interface';

/**
 * Component for uploading and managing task attachments
 * Supports drag & drop and file picker for JPEG/PNG images
 */
@Component({
  selector: 'app-task-attachment-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-attachment-upload.component.html',
  styleUrl: './task-attachment-upload.component.scss'
})
export class TaskAttachmentUploadComponent {
  private fileValidation = inject(FileValidationService);
  private imageCompression = inject(ImageCompressionService);
  private hasInitialized = false;

  @Input() set initialAttachments(attachments: TaskAttachment[] | undefined) {
    // Only initialize once to avoid infinite loop
    if (!this.hasInitialized && attachments && attachments.length > 0) {
      this.attachments.set([...attachments]);
      this.hasInitialized = true;
    }
  }

  @Output() attachmentsChange = new EventEmitter<TaskAttachment[]>();

  attachments = signal<TaskAttachment[]>([]);
  isDragOver = signal(false);
  errorMessage = signal<string | null>(null);

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /**
   * Handle file drop
   */
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      await this.processFiles(Array.from(files));
    }
  }

  /**
   * Handle file selection from input
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files) {
      await this.processFiles(Array.from(files));
      input.value = ''; // Reset input
    }
  }

  /**
   * Process multiple files
   */
  private async processFiles(files: File[]): Promise<void> {
    this.errorMessage.set(null);

    for (const file of files) {
      await this.processFile(file);
    }
  }

  /**
   * Process single file with validation and compression
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
   * Remove attachment by ID
   */
  removeAttachment(id: string): void {
    this.attachments.update(current => 
      current.filter(att => att.id !== id)
    );
    this.attachmentsChange.emit(this.attachments());
  }

  /**
   * Remove all attachments
   */
  removeAllAttachments(): void {
    this.attachments.set([]);
    this.attachmentsChange.emit([]);
  }

  /**
   * Generate unique ID for attachment
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get data URL for preview
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    // During upload, use base64 data URL
    // After upload (when downloadURL exists), use that
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
