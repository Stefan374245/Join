import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Task } from '../../../models/task.interface';
import { Contact } from '../../../models/contact.interface';
import { TaskService } from '../../../services/task.service';
import { ContactService } from '../../../services/contact.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {
  contactsLoading: boolean = true;
  @Input() task!: Task;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();

  private taskService = inject(TaskService);
  private contactService = inject(ContactService);

  contacts: Contact[] = [];
  showDeleteConfirm: boolean = false;
  private lastToggleTime: number = 0;

  ngOnInit(): void {
    this.loadContacts();
  }

  /**
   * Load all contacts
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
   * Close overlay
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Close on overlay background click
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('task-overlay')) {
      this.onClose();
    }
  }

  /**
   * Open edit mode
   */
  onEdit(): void {
    this.edit.emit(this.task);
  }

  /**
   * Show delete confirmation
   */
  showDeleteConfirmation(): void {
    this.showDeleteConfirm = true;
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  /**
   * Confirm delete
   */
  confirmDelete(): void {
    this.delete.emit(this.task.id);
    this.showDeleteConfirm = false;
    this.onClose();
  }

  /**
   * Toggle subtask completion - Update UI immediately, then sync with service
   */
  toggleSubtask(subtaskId: string): void {
    // Debounce: Ignore clicks within 300ms of last toggle
    const now = Date.now();
    if (now - this.lastToggleTime < 300) {
      console.log('⏸️ Click ignored (debounce)');
      return;
    }
    this.lastToggleTime = now;

    if (!this.task.subtasks) {
      console.error('❌ Component: No subtasks found');
      return;
    }

    const subtask = this.task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      console.error('❌ Component: Subtask not found:', subtaskId);
      return;
    }

    const currentState = subtask.completed;
    const newState = !currentState;
    console.log('🎯 Component: Toggling subtask:', subtaskId, 'Current:', currentState, '→ New:', newState);

    // 1. IMMEDIATE UI UPDATE: Toggle locally first for instant feedback
    subtask.completed = newState;
    console.log('🖼️ Component: UI updated immediately to:', subtask.completed);

    // 2. THEN sync with Firestore using the NEW method that sets the value instead of toggling
    this.taskService.updateSubtaskCompletion(this.task.id, subtaskId, newState).subscribe({
      next: () => {
        console.log('✅ Component: Firestore sync completed with state:', newState);
      },
      error: (error) => {
        console.error('❌ Component: Error syncing with Firestore:', error);
        // Revert on error
        subtask.completed = currentState;
        console.log('⏮️ Component: Reverted to:', currentState);
      }
    });
  }

  /**
   * Get contact by user ID
   */
  getContact(userId: string): Contact | undefined {
    return this.contacts.find(c => c.id === userId);
  }

  /**
   * Get contact initials
   */
  getContactInitials(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.initials || '??';
  }

  /**
   * Get contact color
   */
  getContactColor(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.color || '#2A3647';
  }

  /**
   * Get contact full name
   */
  getContactFullName(userId: string): string {
    const contact = this.getContact(userId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown';
  }

  /**
   * Get category CSS class
   */
  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
  }

  /**
   * Get priority icon path
   */
  getPriorityIcon(priority: string): string {
    return `/assets/images/${priority.toLowerCase()}.svg`;
  }
}

