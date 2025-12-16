import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Task } from '../../../models/task.interface';
import { Contact } from '../../../models/contact.interface';
import { TaskService } from '../../../services/task.service';
import { ContactService } from '../../../services/contact.service';
import { ToastService } from '../../../services/toast.service';

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
  private toastService = inject(ToastService);

  contacts: Contact[] = [];
  showDeleteConfirm: boolean = false;
  private lastToggleTime: number = 0;

  ngOnInit(): void {
    this.loadContacts();
  }

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

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('task-overlay')) {
      this.onClose();
    }
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  showDeleteConfirmation(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    this.toastService.showTaskDeleted(this.task.title);
    this.delete.emit(this.task.id);
    this.showDeleteConfirm = false;
    this.onClose();
  }

  toggleSubtask(subtaskId: string): void {
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

    subtask.completed = newState;
    console.log('🖼️ Component: UI updated immediately to:', subtask.completed);

    this.taskService.updateSubtaskCompletion(this.task.id, subtaskId, newState).subscribe({
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

  getContact(userId: string): Contact | undefined {
    return this.contacts.find(c => c.id === userId);
  }

  getContactInitials(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.initials || '??';
  }

  getContactColor(userId: string): string {
    const contact = this.getContact(userId);
    return contact?.color || '#2A3647';
  }

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
    return `/assets/images/${priority.toLowerCase()}.svg`;
  }

  getCreatorIcon(): string {
    if (this.task.creatorType === 'external' || this.task.source === 'email') {
      return '/assets/images/creator-external.svg';
    }
    return '/assets/images/team.svg';
  }

  getCreatorContentIcon(): string {
    if (this.task.source === 'email' || this.task.creatorType === 'external') {
      return '/assets/images/card_email.svg';
    }
    return '/assets/images/creator-profil.svg';
  }

  getCreatorContentText(): string {
    if (this.task.source === 'email' || this.task.creatorType === 'external') {
      return 'E-mail';
    }
    return 'Profil';
  }

  getCreatorContentClass(): string {
    if (this.task.source === 'email' || this.task.creatorType === 'external') {
      return 'content-external';
    }
    return 'content-member';
  }

  getCreatorBadgeClass(): string {
    if (this.task.creatorType === 'external' || this.task.source === 'email') {
      return 'badge-external';
    }
    return 'badge-member';
  }

  getCreatorBadgeText(): string {
    if (this.task.creatorType === 'external' || this.task.source === 'email') {
      return 'Extern';
    }
    return 'Member';
  }

  getCreatorDisplayName(): string {
    if (this.task.creatorName) {
      return this.task.creatorName;
    }
    if (this.task.creatorEmail) {
      return this.task.creatorEmail;
    }
    if (this.task.source === 'member' || this.task.creatorType === 'member') {
      return 'Member';
    }
    return 'Unknown';
  }
}

