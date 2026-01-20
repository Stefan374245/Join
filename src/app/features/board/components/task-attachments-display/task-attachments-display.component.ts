import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskAttachment } from '../../../../core/models/task.interface';

/**
 * Component for displaying task attachments in detail view
 * Uses Signal-based pattern for reactive state management
 */
@Component({
  selector: 'app-task-attachments-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-attachments-display.component.html',
  styleUrl: './task-attachments-display.component.scss'
})
export class TaskAttachmentsDisplayComponent {
  attachments = input<TaskAttachment[]>([]);
  viewAttachment = output<TaskAttachment>();
  deleteAttachment = output<TaskAttachment>();

  hoveredAttachment = signal<string | null>(null);
  hoveredDeleteButton = signal<string | null>(null);

  /**
   * Get preview URL for attachment
   */
  getPreviewUrl(attachment: TaskAttachment): string {
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

  /**
   * Emit click event for attachment viewing
   */
  onAttachmentClick(attachment: TaskAttachment): void {
    this.viewAttachment.emit(attachment);
  }

  /**
   * Delete attachment
   */
  onDeleteClick(event: Event, attachment: TaskAttachment): void {
    event.stopPropagation();
    this.deleteAttachment.emit(attachment);
  }

  /**
   * Track which attachment card is hovered
   */
  setHoveredAttachment(id: string | null): void {
    this.hoveredAttachment.set(id);
  }

  /**
   * Track which delete button is hovered
   */
  setHoveredDeleteButton(id: string | null): void {
    this.hoveredDeleteButton.set(id);
  }

  /**
   * Get delete icon path based on hover state
   */
  getDeleteIcon(attachmentId: string): string {
    return this.hoveredDeleteButton() === attachmentId
      ? 'assets/images/delete-blue.svg'
      : 'assets/images/delete.svg';
  }
}
