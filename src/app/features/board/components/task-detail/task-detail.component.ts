import { Component, input, output, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskAttachment } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { TaskService } from '../../../../core/services/task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AttachmentStorageService } from '../../../../core/services/attachment-storage.service';
import { TaskAttachmentsDisplayComponent } from '../task-attachments-display/task-attachments-display.component';

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
  imports: [CommonModule, TaskAttachmentsDisplayComponent],
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

  // Computed signal that always reads latest task from TaskService
  task = computed<Task | undefined>(() => {
    const id = this.taskId();
    return this.taskService.findTaskById(id);
  });

  constructor() {
    // Monitor contact assignments for debugging in development
    effect(() => {
      const currentTask = this.task();
      if (!currentTask) return;
      
      if (currentTask.assignedTo?.length > 0 && this.contacts().length > 0) {
        // Check if all assigned contacts exist (only in development)
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

    // Use TaskService for centralized subtask management
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

  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
  }

  /**
   * Deletes an attachment from Storage and Firestore
   * @param attachment - The attachment to delete
   */
  async onDeleteAttachment(attachment: TaskAttachment): Promise<void> {
    const currentTask = this.task();
    if (!currentTask) return;

    try {
      // Delete from Firebase Storage if downloadURL exists
      if (attachment.downloadURL) {
        await this.attachmentStorageService.deleteAttachment(attachment.downloadURL);
      }

      // Remove from task in Firestore
      await this.taskService.removeAttachment(currentTask.id, attachment.id);

      this.toastService.showSuccess('Attachment deleted successfully');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      this.toastService.showError('Failed to delete attachment');
    }
  }

  getPriorityIcon(priority: string): string {
    return `assets/images/${priority.toLowerCase()}.svg`;
  }

  getCreatorIcon(): string {
    const currentTask = this.task();
    if (!currentTask) return 'assets/images/team.svg';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'assets/images/creator-external.svg';
    }
    return 'assets/images/team.svg';
  }

  getCreatorContentIcon(): string {
    const currentTask = this.task();
    if (!currentTask) return 'assets/images/creator-profil.svg';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'assets/images/card_email.svg';
    }
    return 'assets/images/creator-profil.svg';
  }

  getCreatorContentText(): string {
    const currentTask = this.task();
    if (!currentTask) return 'Profil';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'E-mail';
    }
    return 'Profil';
  }

  getCreatorContentClass(): string {
    const currentTask = this.task();
    if (!currentTask) return 'content-member';
    
    if (currentTask.source === 'email' || currentTask.creatorType === 'external') {
      return 'content-external';
    }
    return 'content-member';
  }

  getCreatorBadgeClass(): string {
    const currentTask = this.task();
    if (!currentTask) return 'badge-member';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'badge-external';
    }
    return 'badge-member';
  }

  getCreatorBadgeText(): string {
    const currentTask = this.task();
    if (!currentTask) return 'Member';
    
    if (currentTask.creatorType === 'external' || currentTask.source === 'email') {
      return 'Extern';
    }
    return 'Member';
  }

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

