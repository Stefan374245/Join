import { Component, input, output, inject, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskAttachment } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { TaskService } from '../../../../core/services/task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AttachmentStorageService } from '../../../../core/services/attachment-storage.service';
import { TaskAttachmentsDisplayComponent } from '../task-attachments-display/task-attachments-display.component';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

/**
 * Task detail overlay component for comprehensive task viewing and editing.
 * 
 * This component provides a detailed view and editing interface for individual tasks displayed
 * in an overlay format. It handles all aspects of task management including basic information
 * editing, subtask management, contact assignment, priority and category selection, and real-time
 * form validation. The component supports both viewing and editing modes with seamless transitions.
 * 
 * Key Features:
 * - Complete task information display and editing
 * - Reactive form validation with Angular Forms
 * - Subtask creation, editing, completion tracking, and deletion
 * - Contact assignment with visual avatar selection
 * - Priority level management with icon indicators
 * - Category selection with predefined options
 * - Real-time form state management and validation
 * - Auto-save functionality with optimistic updates
 * - Loading states and error handling
 * - Overlay management with backdrop click handling
 * - Responsive design for various screen sizes
 * - Keyboard navigation and accessibility support
 */
@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, TaskAttachmentsDisplayComponent, ImageViewerComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent {
  taskId = input.required<string>();
  contacts = input.required<Contact[]>();
  isVisible = input<boolean>(false);
  close = output<void>();
  edit = output<Task>();
  delete = output<string>();

  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private attachmentStorageService = inject(AttachmentStorageService);
  showDeleteConfirm: boolean = false;
  private lastToggleTime: number = 0;

  selectedAttachment = signal<TaskAttachment | null>(null);
  
  selectedAttachmentIndex = computed<number>(() => {
    const attachment = this.selectedAttachment();
    const currentTask = this.task();
    
    if (!attachment || !currentTask?.attachments) {
      return 0;
    }
    
    const index = currentTask.attachments.findIndex(att => att.id === attachment.id);
    return index >= 0 ? index : 0;
  });

  showImageViewer = computed<boolean>(() => this.selectedAttachment() !== null);

  task = computed<Task | undefined>(() => {
    const id = this.taskId();
    return this.taskService.findTaskById(id);
  });

  /**
   * Initializes the TaskDetailComponent and sets up a reactive effect to monitor the current task.
   * 
   * The effect checks if the current task and contacts are available. If so, and if the application is running
   * on localhost, it iterates through the assigned user IDs of the current task and verifies that each user
   * has a corresponding contact. If a contact is missing, a warning is logged to the console.
   *
   * This logic is intended for development environments only (i.e., when running on localhost).
   */
  constructor() {
    effect(() => {
      const currentTask = this.task();
      if (!currentTask) return;
      
      if (currentTask.assignedTo?.length > 0 && this.contacts().length > 0) {
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) return;
        
        currentTask.assignedTo.forEach(userId => {
          const contact = this.getContact(userId);
          if (!contact) {
            console.warn(`⚠️ TaskDetail: Contact not found for user ID: ${userId}`);
          }
        });
      }
    });
  }

  /**
   * Closes the task detail overlay and emits the close event to parent component.
   * This method handles the cleanup and communication needed to hide the task detail view.
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handles overlay click events for click-outside-to-close functionality. 
   * This method checks if the click occurred on the overlay background (not on the modal content)
   * and triggers the close action to provide intuitive UX for dismissing the modal.
   * 
   * @param event - The mouse click event to analyze for target element
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('task-overlay')) {
      this.onClose();
    }
  }

  /**
   * Initiates task editing mode by emitting the current task to the parent component.
   * This triggers the transition from view mode to edit mode in the task management flow.
   */
  onEdit(): void {
    const currentTask = this.task();
    if (!currentTask) return;
    this.edit.emit(currentTask);
  }

  /**
   * Displays the delete confirmation dialog to prevent accidental task deletion.
   * Sets the UI state to show confirmation buttons and warning message before proceeding.
   */
  showDeleteConfirmation(): void {
    this.showDeleteConfirm = true;
  }

  /**
   * Cancels the delete operation and hides the confirmation dialog.
   * Resets the UI state back to normal view without performing any deletion.
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  /**
   * Confirms and executes the task deletion process.
   * 
   * This method shows a success toast notification, emits the delete event with task ID,
   * hides the confirmation dialog, and closes the task detail view. The actual deletion
   * is handled by the parent component to maintain proper data flow.
   */
  confirmDelete(): void {
    const currentTask = this.task();
    if (!currentTask) return;
    
    this.toastService.showTaskDeleted(currentTask.title);
    this.delete.emit(currentTask.id);
    this.showDeleteConfirm = false;
    this.onClose();
  }

  /**
   * Toggles the completion status of a subtask with optimistic UI updates and debouncing.
   * 
   * Uses TaskService for centralized subtask management with optimistic UI updates
   * for better user experience.
   * 
   * @param subtaskId - The unique identifier of the subtask to toggle
   */
  async toggleSubtask(subtaskId: string): Promise<void> {
    const now = Date.now();
    if (now - this.lastToggleTime < 300) {
      console.log('⏸️ Click ignored (debounce)');
      return;
    }
    this.lastToggleTime = now;

    const currentTask = this.task();
    if (!currentTask || !currentTask.subtasks) {
      console.error('❌ Component: No task or subtasks found');
      return;
    }

    const subtask = currentTask.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      console.error('❌ Component: Subtask not found:', subtaskId);
      return;
    }

    const newState = !subtask.completed;
    console.log('🎯 Component: Toggling subtask:', subtaskId, 'Current:', subtask.completed, '→ New:', newState);

    try {
      await this.taskService.toggleSubtask(currentTask.id, subtaskId);
      console.log('✅ Component: Subtask toggled successfully');
    } catch (error) {
      console.error('❌ Component: Error toggling subtask:', error);
      this.toastService.showError('Failed to update subtask');
    }
  }

  /**
   * Retrieves a contact object by user ID from ContactService signals.
   * 
   * This utility method provides centralized contact lookup functionality used
   * by other contact-related methods throughout the component.
   * 
   * @param userId - The unique identifier of the contact to retrieve
   * @returns Contact object if found, undefined if not found
   */
  getContact(userId: string): Contact | undefined {
    return this.contacts().find(c => c.id === userId);
  }

  /**
   * Gets the display initials for a contact by user ID.
   * 
   * Returns pre-calculated initials for displaying in contact avatars and badges
   * throughout the task detail interface.
   * 
   * @param userId - The unique identifier of the contact
   * @returns Two-letter initials or "??" if contact not found
   */
  getContactInitials(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.initials || '??';
  }

  /**
   * Gets the assigned color for a contact by user ID.
   * 
   * Returns the contact's designated color for consistent avatar and UI element styling
   * across the application.
   * 
   * @param userId - The unique identifier of the contact
   * @returns Hex color code or default dark blue if contact not found
   */
  getContactColor(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.color || '#2A3647';
  }

  /**
   * Gets the full display name for a contact by user ID.
   * 
   * Combines first and last name for complete contact identification in tooltips,
   * detailed views, and accessibility features.
   * 
   * @param userId - The unique identifier of the contact
   * @returns Full name string or "Unknown" if contact not found
   */
  getContactFullName(userId: string): string {
    const contact = this.getContact(userId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown';
  }

  /**
   * Converts a category name to a CSS-friendly class name.
   *
   * This method transforms the input string to lowercase and replaces all whitespace
   * characters with hyphens, making it suitable for use as a CSS class.
   *
   * @param category - The category name to be converted.
   * @returns The formatted string as a CSS class name.
   */
  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Formats a given Date object into a string with the format 'MM/DD/YYYY'.
   *
   * @param date - The Date object to format.
   * @returns A string representing the formatted date in 'MM/DD/YYYY' format,
   *          or an empty string if the input is falsy.
   */
  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
  }


  /**
   * Opens image viewer with selected attachment
   * @param attachment - The attachment to view
   */
  onViewAttachment(attachment: TaskAttachment): void {
    this.selectedAttachment.set(attachment);
  }

  /**
   * Downloads a single attachment
   * @param attachment - The attachment to download
   */
  async onDownloadAttachment(attachment: TaskAttachment): Promise<void> {
    try {
      await this.attachmentStorageService.downloadSingleAttachment(attachment);
      this.toastService.showSuccess('Download started');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      this.toastService.showError('Failed to download attachment');
    }
  }

  
  /**
   * Downloads all attachments of the current task as a ZIP file.
   *
   * - If there are no attachments, displays an error toast notification.
   * - Otherwise, generates a ZIP file name based on the task title,
   *   initiates the download via the attachment storage service,
   *   and shows a success toast notification.
   * - Handles and logs any errors, displaying an error toast if the download fails.
   *
   * @returns {Promise<void>} A promise that resolves when the download process is complete.
   */
  async onDownloadAllAttachmentsAsZip(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask || !currentTask.attachments || currentTask.attachments.length === 0) {
      this.toastService.showError('No attachments to download');
      return;
    }

    try {
      const zipName = `${currentTask.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attachments`;
      await this.attachmentStorageService.downloadAllAsZip(currentTask.attachments, zipName);
      this.toastService.showSuccess(`Downloading ${currentTask.attachments.length} attachments as ZIP`);
    } catch (error) {
      console.error('Error downloading all attachments:', error);
      this.toastService.showError('Failed to download attachments');
    }
  }


  /**
   * Closes the image viewer by resetting the selected attachment to null.
   * This method is typically called when the user closes the image viewer modal or overlay.
   */
  onCloseImageViewer(): void {
    this.selectedAttachment.set(null);
  }

  /**
   * Returns the file path to the SVG icon corresponding to the given task priority.
   *
   * @param priority - The priority level of the task (e.g., 'High', 'Medium', 'Low').
   * @returns The relative path to the SVG icon for the specified priority.
   */
  getPriorityIcon(priority: string): string {
    return `assets/images/${priority.toLowerCase()}.svg`;
  }

  /**
   * Returns the appropriate icon path for the task creator.
   *
   * - If there is no current task, returns the default team icon.
   * - If the creator type is 'external' or the source is 'email', returns the external creator icon.
   * - Otherwise, returns the default team icon.
   *
   * @returns {string} The file path to the creator's icon image.
   */
  getCreatorIcon(): string {
    const currentTask = this.task();
    if (!currentTask) return 'assets/images/team.svg';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'assets/images/creator-external.svg';
    }
    return 'assets/images/team.svg';
  }

  /**
   * Returns the appropriate icon path representing the creator of the current task.
   *
   * - If there is no current task, returns the default creator profile icon.
   * - If the task's source is 'email' or the creator type is 'external', returns the email card icon.
   * - Otherwise, returns the default creator profile icon.
   *
   * @returns {string} The file path to the icon representing the task creator.
   */
  getCreatorContentIcon(): string {
    const currentTask = this.task();
    if (!currentTask) return 'assets/images/creator-profil.svg';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'assets/images/card_email.svg';
    }
    return 'assets/images/creator-profil.svg';
  }

  /**
   * Returns a string representing the content type of the task creator.
   *
   * - If the current task does not exist, returns 'Profil'.
   * - If the task's source is 'email' or the creator type is 'external', returns 'E-mail'.
   * - Otherwise, returns 'Profil'.
   *
   * @returns {string} The content type text for the task creator.
   */
  getCreatorContentText(): string {
    const currentTask = this.task();
    if (!currentTask) return 'Profil';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'E-mail';
    }
    return 'Profil';
  }

  /**
   * Determines the CSS class to apply based on the creator of the current task.
   *
   * Returns `'content-external'` if the task was created from an email or by an external creator,
   * otherwise returns `'content-member'`.
   *
   * @returns {string} The CSS class name representing the creator type.
   */
  getCreatorContentClass(): string {
    const currentTask = this.task();
    if (!currentTask) return 'content-member';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'content-external';
    }
    return 'content-member';
  }

  /**
   * Returns the CSS class name for the creator badge based on the current task's creator type and source.
   *
   * - If the task's creator type is 'external' or the source is 'email', returns 'badge-external'.
   * - Otherwise, returns 'badge-member'.
   *
   * @returns {string} The CSS class name for the creator badge.
   */
  getCreatorBadgeClass(): string {
    const currentTask = this.task();
    if (!currentTask) return 'badge-member';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'badge-external';
    }
    return 'badge-member';
  }

  /**
   * Returns the badge text representing the creator type of the current task.
   *
   * - If there is no current task, returns `'Member'`.
   * - If the creator type is `'external'` or the source is `'email'`, returns `'Extern'`.
   * - Otherwise, returns `'Member'`.
   *
   * @returns {string} The badge text for the task creator.
   */
  getCreatorBadgeText(): string {
    const currentTask = this.task();
    if (!currentTask) return 'Member';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'Extern';
    }
    return 'Member';
  }

  /**
   * Returns a display name for the creator of the current task.
   *
   * The method checks for the creator's name, then email, and finally falls back to
   * a generic label based on the creator's type or source. If none of these are available,
   * it returns 'Unknown'.
   *
   * @returns {string} The display name of the task creator, their email, 'Member', or 'Unknown'.
   */
  getCreatorDisplayName(): string {
    const task = this.task();
    if (!task) return 'Unknown';
    
    const creatorName = task.creatorName;
    if (creatorName) {
      return creatorName;
    }
    const creatorEmail = task.creatorEmail;
    if (creatorEmail) {
      return creatorEmail;
    }
    if (task.source === 'member' || task.creatorType === 'member') {
      return 'Member';
    }
    return 'Unknown';
  }
}

