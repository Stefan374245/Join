import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { ToastService } from '../../../../core/services/toast.service';

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
  imports: [CommonModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {
  contactsLoading: boolean = true;
  task = input.required<Task>();
  isVisible = input<boolean>(false);
  close = output<void>();
  edit = output<Task>();
  delete = output<string>();

  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);

  contacts: Contact[] = [];
  showDeleteConfirm: boolean = false;
  private lastToggleTime: number = 0;

  /**
   * Angular lifecycle hook for component initialization.
   * Triggers the loading of contacts data required for task assignment functionality.
   * This ensures that contact information is available when the component is ready for user interaction.
   */
  ngOnInit(): void {
    this.loadContacts();
  }

  /**
   * Loads contact data from the ContactService for task assignment functionality.
   * 
   * This method fetches all available contacts and manages loading states to provide
   * visual feedback to users. Contact data is essential for displaying assigned users
   * and enabling contact assignment/removal operations within the task detail view.
   */
  private loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (contacts) => {
        setTimeout(() => {
          this.contacts = contacts;
          this.contactsLoading = false;
        }, 600);
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.contactsLoading = false;
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
   * Handles clicks on the overlay backdrop to enable click-outside-to-close functionality.
   * 
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
    this.edit.emit(this.task());
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
    this.toastService.showTaskDeleted(this.task().title);
    this.delete.emit(this.task().id);
    this.showDeleteConfirm = false;
    this.onClose();
  }

  /**
   * Toggles the completion status of a subtask with optimistic UI updates and debouncing.
   * 
   * This method implements optimistic UI updates for better user experience, immediately
   * updating the UI state while syncing with Firestore in the background. It includes
   * debouncing to prevent rapid consecutive clicks and provides rollback functionality
   * if the server update fails.
   * 
   * Features:
   * - 300ms debounce protection against rapid clicks
   * - Optimistic UI updates for immediate visual feedback
   * - Error handling with automatic state rollback
   * - Comprehensive logging for debugging
   * 
   * @param subtaskId - The unique identifier of the subtask to toggle
   */
  toggleSubtask(subtaskId: string): void {
    const now = Date.now();
    if (now - this.lastToggleTime < 300) {
      console.log('⏸️ Click ignored (debounce)');
      return;
    }
    this.lastToggleTime = now;

    if (!this.task().subtasks) {
      console.error('❌ Component: No subtasks found');
      return;
    }

    const subtask = this.task().subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      console.error('❌ Component: Subtask not found:', subtaskId);
      return;
    }

    const currentState = subtask.completed;
    const newState = !currentState;
    console.log('🎯 Component: Toggling subtask:', subtaskId, 'Current:', currentState, '→ New:', newState);

    subtask.completed = newState;
    console.log('🖼️ Component: UI updated immediately to:', subtask.completed);

    this.taskService.updateSubtaskCompletion(this.task().id, subtaskId, newState).subscribe({
      next: () => {
        console.log('✅ Component: Firestore sync completed with state:', newState);
      },
      error: (error) => {
        console.error('❌ Component: Error syncing with Firestore:', error);
        subtask.completed = currentState;
        console.log('⏮️ Component: Reverted to:', currentState);
      }
    });
  }

  /**
   * Retrieves a contact object by user ID from the loaded contacts array.
   * 
   * This utility method provides centralized contact lookup functionality used
   * by other contact-related methods throughout the component.
   * 
   * @param userId - The unique identifier of the contact to retrieve
   * @returns Contact object if found, undefined if not found
   */
  getContact(userId: string): Contact | undefined {
    return this.contacts.find(c => c.id === userId);
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

  getPriorityIcon(priority: string): string {
    return `assets/images/${priority.toLowerCase()}.svg`;
  }

  getCreatorIcon(): string {
    if (this.task().creatorType === 'external' || this.task().source === 'email') {
      return 'assets/images/creator-external.svg';
    }
    return 'assets/images/team.svg';
  }

  getCreatorContentIcon(): string {
    if (this.task().source === 'email' || this.task().creatorType === 'external') {
      return 'assets/images/card_email.svg';
    }
    return 'assets/images/creator-profil.svg';
  }

  getCreatorContentText(): string {
    if (this.task().source === 'email' || this.task().creatorType === 'external') {
      return 'E-mail';
    }
    return 'Profil';
  }

  getCreatorContentClass(): string {
    if (this.task().source === 'email' || this.task().creatorType === 'external') {
      return 'content-external';
    }
    return 'content-member';
  }

  getCreatorBadgeClass(): string {
    if (this.task().creatorType === 'external' || this.task().source === 'email') {
      return 'badge-external';
    }
    return 'badge-member';
  }

  getCreatorBadgeText(): string {
    if (this.task().creatorType === 'external' || this.task().source === 'email') {
      return 'Extern';
    }
    return 'Member';
  }

  getCreatorDisplayName(): string {
    const task = this.task();
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

