import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @Input() task!: Task;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();

  private taskService = inject(TaskService);
  private contactService = inject(ContactService);

  contacts: Contact[] = [];
  showDeleteConfirm: boolean = false;

  ngOnInit(): void {
    this.loadContacts();
  }

  /**
   * Load all contacts
   */
  private loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
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
   * Toggle subtask completion
   */
  toggleSubtask(subtaskId: string): void {
    this.taskService.toggleSubtask(this.task.id, subtaskId).subscribe({
      next: () => {
        console.log('✅ Subtask toggled successfully');
      },
      error: (error) => {
        console.error('Error toggling subtask:', error);
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
    return `assets/images/${priority.toLowerCase()}.svg`;
  }
}

