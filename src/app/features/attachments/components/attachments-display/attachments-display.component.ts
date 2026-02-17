import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskAttachment } from '../../../../core/models/task.interface';
import { formatFileSize } from '../../../../shared/utils';

@Component({
  selector: 'app-attachments-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attachments-display.component.html',
  styleUrl: './attachments-display.component.scss'
})
export class AttachmentsDisplayComponent {
  readonly maxVisible = 3;
  attachments = input<TaskAttachment[]>([]);
  isEditMode = input<boolean>(false);

  visibleAttachments = computed<TaskAttachment[]>(() => {
    return this.attachments().slice(0, this.maxVisible);
  });

  hiddenCount = computed<number>(() => {
    return Math.max(0, this.attachments().length - this.maxVisible);
  });

  hasHidden = computed<boolean>(() => this.hiddenCount() > 0);
  
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
   * @param attachment - The task attachment object containing file information.
   * @returns {string} - A URL that can be used to preview the attachment, either from a download URL or as a data URL.
   * @remarks This function checks if the attachment has a `downloadURL` property and returns it if available. If not, it checks for the presence of `base64` data and constructs a data URL using the MIME type specified in `fileType`. This allows for previewing attachments that may not have been uploaded to a server yet but have their content available in base64 format.
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
   * Formats a file size in bytes into a human-readable string with appropriate units (B, KB, MB).
   * @param size - The file size in bytes to format.
   * @return {string} - A formatted string representing the file size with appropriate units.
   * @remarks This function takes a file size in bytes and converts it into a more human-readable format. It checks the size against thresholds for kilobytes (KB) and megabytes (MB) and formats the number accordingly, rounding to two decimal places for KB and MB. If the size is less than 1 KB, it returns the size in bytes with a "B" suffix.
    */
  formatFileSize = formatFileSize;

  /**
   * Handles the click event for viewing an attachment.
   * @param event - The click event triggered by the user.
   * @param attachment - The task attachment that was clicked.
   * @param visibleIndex - The index of the clicked attachment in the visible attachments list.
   * @return {void}
   * @remarks This method determines which attachment to open when a user clicks on an attachment. If the clicked attachment is the last visible one and there are hidden attachments, it will open the first hidden attachment instead. This allows users to access hidden attachments by clicking on the last visible one, providing a convenient way to view all attachments even when some are hidden due to display limits.
   */
  onAttachmentClick(event: MouseEvent, attachment: TaskAttachment, visibleIndex: number): void {
    if (!attachment) {
      console.error('❌ Attachment is undefined!');
      return;
    }

    const shouldOpenFirstHidden = this.hasHidden() && visibleIndex === this.maxVisible - 1;
    const attachmentToOpen = shouldOpenFirstHidden
      ? this.attachments()[this.maxVisible] ?? attachment
      : attachment;

    event.stopPropagation();
    this.viewAttachment.emit(attachmentToOpen);
  }

 
  /**
   * Handles the click event for deleting a task attachment.
   * @param event - The click event triggered by the user.
   * @param attachment - The task attachment to be deleted.
   * @return {void}
   * @remarks This method stops the click event from propagating to parent elements and emits the `deleteAttachment` event with the specified attachment. This allows parent components to handle the deletion logic, such as showing a confirmation dialog or updating the list of attachments after deletion.
   */
  onDeleteClick(event: Event, attachment: TaskAttachment): void {
    event.stopPropagation();
    this.deleteAttachment.emit(attachment);
  }


  /**
   * Sets the currently hovered attachment by its ID.
   * @param id - The ID of the attachment to mark as hovered, or `null` to clear the hovered state.
   * @return {void}
   * @remarks This method updates the `hoveredAttachment` signal with the provided attachment ID. When an attachment is hovered, its ID is set in the signal, allowing the component to apply hover styles or show additional options for that specific attachment. Passing `null` will clear the hovered state, indicating that no attachment is currently being hovered.
   */
  setHoveredAttachment(id: string | null): void {
    this.hoveredAttachment.set(id);
  }

  
  /**
   * Sets the currently hovered delete button by its identifier.
   * @param id - The unique identifier of the delete button to mark as hovered, or `null` to clear the hovered state.
   * @return {void}
   * @remarks This method updates the `hoveredDeleteButton` signal with the provided button ID. When a delete button is hovered, its ID is set in the signal, allowing the component to apply hover styles or show additional options for that specific button. Passing `null` will clear the hovered state, indicating that no delete button is currently being hovered.
   */
  setHoveredDeleteButton(id: string | null): void {
    this.hoveredDeleteButton.set(id);
  }

  
  /**
   * Returns the appropriate delete icon path based on whether the delete button for the given attachment is being hovered.
   * @param attachmentId - The unique identifier of the attachment.
   * @return {string} - The file path to the delete icon image. Returns the blue delete icon if the button is hovered, otherwise returns the default delete icon.
   * @remarks This method checks if the `hoveredDeleteButton` signal matches the provided attachment ID. If it does, it returns the path to the blue delete icon, indicating that the button is currently hovered. If it does not match, it returns the path to the default delete icon. This allows the UI to visually indicate when a delete button is being hovered by changing its icon.
  */
  getDeleteIcon(attachmentId: string): string {
    return this.hoveredDeleteButton() === attachmentId
      ? 'assets/images/delete-blue.svg'
      : 'assets/images/delete.svg';
  }

  
  /**
   * Handles the click event for downloading a task attachment.
   * @param event - The click event triggered by the user.
   * @param attachment - The task attachment to be downloaded.
   * @return {void}
   * @remarks This method stops the click event from propagating to parent elements and emits the `downloadAttachment` event with the specified attachment. This allows parent components to handle the download logic, such as initiating a file download or opening a download dialog for the attachment.
   */
  onDownloadClick(event: Event, attachment: TaskAttachment): void {
    event.stopPropagation();
    this.downloadAttachment.emit(attachment);
  }

  
  /**
   * Sets the currently hovered download button by its identifier.
   * @param id - The identifier of the download button to mark as hovered, or `null` to clear the hovered state.
   * @return {void}
   * @remarks This method updates the `hoveredDownloadButton` signal with the provided button ID. When a download button is hovered, its ID is set in the signal, allowing the component to apply hover styles or show additional options for that specific button. Passing `null` will clear the hovered state, indicating that no download button is currently being hovered.
   */
  setHoveredDownloadButton(id: string | null): void {
    this.hoveredDownloadButton.set(id);
  }

  /**
   * Returns the appropriate download icon path based on whether the download button
   * @param attachmentId - The unique identifier of the attachment.
   * @return {string} - The file path to the download icon image. Returns the blue download icon if the button is hovered, otherwise returns the default download icon.
   * @remarks This method checks if the `hoveredDownloadButton` signal matches the provided attachment ID. If it does, it returns the path to the blue download icon, indicating that the button is currently hovered. If it does not match, it returns the path to the default download icon. This allows the UI to visually indicate when a download button is being hovered by changing its icon.
   */
  getDownloadIcon(attachmentId: string): string {
    return this.hoveredDownloadButton() === attachmentId
      ? 'assets/images/download-blue.svg'
      : 'assets/images/download.svg';
  }

  
  /**
   * Handles the "Download All as Zip" action by stopping event propagation and emitting the `downloadAllAsZip` event.
   * @param event - The DOM event triggered by the user interaction.
   * @return {void}
   * @remarks This method is triggered when the user clicks on the "Download All as Zip" option. It stops the click event from propagating to parent elements and emits the `downloadAllAsZip` event, allowing parent components to handle the logic for downloading all attachments as a ZIP file.
   */
  onDownloadAllAsZip(event: Event): void {
    event.stopPropagation();
    this.downloadAllAsZip.emit();
  }

 
  /**
   * Determines whether the image associated with the given attachment ID is currently loading.
   * @param attachmentId - The unique identifier of the attachment whose image loading state is being checked.
   * @return {boolean} - Returns `true` if the image is currently loading (i.e., if the loading state is not set or is `true`), and `false` if the image has finished loading (i.e., if the loading state is explicitly set to `false`).
   * @remarks This method checks the `imageLoadingStates` signal, which is a Map that tracks the loading state of images by their attachment IDs. If the Map does not have an entry for the given attachment ID, it defaults to `true`, indicating that the image is considered to be loading until explicitly marked as loaded. This allows the component to display loading indicators for images that are still being fetched or processed.
   */
  isImageLoading(attachmentId: string): boolean {
    return this.imageLoadingStates().get(attachmentId) ?? true;
  }


  /**
   * Handles the start of an image loading process for a given attachment.
   * @param attachmentId - The unique identifier of the attachment whose image is starting to load.
   * @return {void}
   * @remarks This method updates the `imageLoadingStates` map to indicate that the image with the specified
   * `attachmentId` is currently loading. This allows the component to display loading indicators for images that are still being fetched or processed.
   */
  onImageLoadStart(attachmentId: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(attachmentId, true);
    this.imageLoadingStates.set(states);
  }

 
  /**
   * Handles the event when an image attachment has finished loading.
   * @param attachmentId - The unique identifier of the attachment whose image has finished loading.
   * @return {void}
   * @remarks This method updates the `imageLoadingStates` map to indicate that the image with the specified `attachmentId` has finished loading by setting its state to `false`. This allows the component to hide loading indicators and display the loaded image to the user.
   */
  onImageLoaded(attachmentId: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(attachmentId, false);
    this.imageLoadingStates.set(states);
  }

  /**
   * TrackBy function for attachments list to prevent unnecessary re-renders
   * @param index - Array index
   * @param attachment - Attachment object
   * @returns {string} - Unique identifier of the attachment
   * @remarks This function is used as a TrackBy function in Angular's ngFor directive to optimize rendering of the attachments list. By returning a unique identifier (in this case, the attachment's ID), Angular can efficiently track which items have changed, been added, or removed, and only re-render those specific items instead of the entire list. This improves performance, especially when dealing with large lists of attachments.
   */
  trackByAttachmentId(_index: number, attachment: TaskAttachment): string {
    return attachment.id;
  }
}
