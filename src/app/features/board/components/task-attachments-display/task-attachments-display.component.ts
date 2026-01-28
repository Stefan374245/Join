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
  isEditMode = input<boolean>(false);
  
  viewAttachment = output<TaskAttachment>();
  deleteAttachment = output<TaskAttachment>();
  downloadAttachment = output<TaskAttachment>();
  downloadAllAsZip = output<void>();

  hoveredAttachment = signal<string | null>(null);
  hoveredDeleteButton = signal<string | null>(null);
  hoveredDownloadButton = signal<string | null>(null);
  imageLoadingStates = signal<Map<string, boolean>>(new Map());

 
  /**
   * Returns a preview URL for the given task attachment.
   *
   * If the attachment has a `downloadURL`, it returns that URL directly.
   * Otherwise, it constructs a data URL using the attachment's `fileType` and `base64` content.
   *
   * @param attachment - The task attachment object containing file information.
   * @returns A string representing the preview URL for the attachment.
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

 
  /**
   * Formats a file size in bytes into a human-readable string with appropriate units (B, KB, MB).
   *
   * - For sizes less than 1024 bytes, returns the size in bytes (e.g., "512 B").
   * - For sizes less than 1 MB, returns the size in kilobytes with one decimal place (e.g., "2.5 KB").
   * - For sizes 1 MB or greater, returns the size in megabytes with one decimal place (e.g., "1.2 MB").
   *
   * @param bytes - The file size in bytes.
   * @returns The formatted file size as a string.
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  
  /**
   * Handles the click event on a task attachment.
   * Emits the selected attachment using the `viewAttachment` event emitter.
   *
   * @param attachment - The task attachment that was clicked.
   */
  onAttachmentClick(attachment: TaskAttachment): void {
    this.viewAttachment.emit(attachment);
  }

 
  /**
   * Handles the click event for deleting a task attachment.
   * 
   * Stops the event from propagating further and emits the `deleteAttachment` event
   * with the specified attachment to notify parent components of the deletion request.
   *
   * @param event - The click event triggered by the user.
   * @param attachment - The task attachment to be deleted.
   */
  onDeleteClick(event: Event, attachment: TaskAttachment): void {
    event.stopPropagation();
    this.deleteAttachment.emit(attachment);
  }


  /**
   * Sets the currently hovered attachment by its ID.
   * 
   * @param id - The ID of the attachment to mark as hovered, or `null` to clear the hovered state.
   */
  setHoveredAttachment(id: string | null): void {
    this.hoveredAttachment.set(id);
  }

  
  /**
   * Sets the currently hovered delete button by its identifier.
   * 
   * @param id - The unique identifier of the delete button to mark as hovered, or `null` to clear the hovered state.
   */
  setHoveredDeleteButton(id: string | null): void {
    this.hoveredDeleteButton.set(id);
  }

  
  /**
   * Returns the appropriate delete icon path based on whether the delete button for the given attachment is being hovered.
   *
   * @param attachmentId - The unique identifier of the attachment.
   * @returns The file path to the delete icon image. Returns the blue delete icon if the button is hovered, otherwise returns the default delete icon.
   */
  getDeleteIcon(attachmentId: string): string {
    return this.hoveredDeleteButton() === attachmentId
      ? 'assets/images/delete-blue.svg'
      : 'assets/images/delete.svg';
  }

  
  /**
   * Handles the click event for downloading a task attachment.
   * 
   * Stops the event from propagating further and emits the `downloadAttachment` event
   * with the provided attachment.
   *
   * @param event - The click event triggered by the user.
   * @param attachment - The task attachment to be downloaded.
   */
  onDownloadClick(event: Event, attachment: TaskAttachment): void {
    event.stopPropagation();
    this.downloadAttachment.emit(attachment);
  }

  
  /**
   * Sets the currently hovered download button by its identifier.
   *
   * @param id - The identifier of the download button to mark as hovered, or `null` to clear the hovered state.
   */
  setHoveredDownloadButton(id: string | null): void {
    this.hoveredDownloadButton.set(id);
  }

  
  /**
   * Returns the appropriate download icon path based on whether the download button
   * for the specified attachment is currently being hovered.
   *
   * @param attachmentId - The unique identifier of the attachment.
   * @returns The file path to the download icon image. Returns the blue icon if the
   *          button is hovered, otherwise returns the default icon.
   */
  getDownloadIcon(attachmentId: string): string {
    return this.hoveredDownloadButton() === attachmentId
      ? 'assets/images/download-blue.svg'
      : 'assets/images/download.svg';
  }

  
  /**
   * Handles the "Download All as Zip" action by stopping event propagation
   * and emitting the `downloadAllAsZip` event to notify parent components.
   *
   * @param event - The DOM event triggered by the user interaction.
   */
  onDownloadAllAsZip(event: Event): void {
    event.stopPropagation();
    this.downloadAllAsZip.emit();
  }

 
  /**
   * Determines whether the image associated with the given attachment ID is currently loading.
   *
   * @param attachmentId - The unique identifier of the attachment.
   * @returns `true` if the image is still loading or if the loading state is unknown; otherwise, `false`.
   */
  isImageLoading(attachmentId: string): boolean {
    return this.imageLoadingStates().get(attachmentId) ?? true;
  }


  /**
   * Handles the start of an image loading process for a given attachment.
   * 
   * Updates the `imageLoadingStates` map to indicate that the image with the specified
   * `attachmentId` is currently loading.
   *
   * @param attachmentId - The unique identifier of the attachment whose image is starting to load.
   */
  onImageLoadStart(attachmentId: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(attachmentId, true);
    this.imageLoadingStates.set(states);
  }

 
  /**
   * Handles the event when an image attachment has finished loading.
   * 
   * Updates the image loading state for the specified attachment by setting its loading state to `false`.
   * This method is typically called when an image has been successfully loaded in the UI.
   *
   * @param attachmentId - The unique identifier of the image attachment that has finished loading.
   */
  onImageLoaded(attachmentId: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(attachmentId, false);
    this.imageLoadingStates.set(states);
  }
}
