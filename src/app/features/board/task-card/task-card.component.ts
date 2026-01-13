import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../../core/models/task.interface';
import { Contact } from '../../../core/models/contact.interface';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input({ required: true }) contacts: Contact[] = [];
  @Output() taskClicked = new EventEmitter<Task>();

  onTaskClick(): void {
    this.taskClicked.emit(this.task);
  }

  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  getShortDescription(description: string): string {
    if (!description) return '';
    const maxLength = 120;
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  getSubtaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((st) => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter((st) => st.completed).length;
  }

  areAllSubtasksCompleted(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.every((st) => st.completed);
  }

  hasIncompleteSubtasks(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.some((st) => !st.completed);
  }

  getContactColor(userId: string): string {
    const contact = this.contacts.find((c) => c.id === userId);
    return contact?.color || '#29abe2';
  }

  getContactInitials(userId: string): string {
    const contact = this.contacts.find((c) => c.id === userId);
    return contact?.initials || '??';
  }

  getPriorityIcon(priority: 'low' | 'medium' | 'high'): string {
    const iconMap = {
      low: 'assets/images/low.svg',
      medium: 'assets/images/medium.svg',
      high: 'assets/images/urgent.svg',
    };
    return iconMap[priority] || iconMap['medium'];
  }
}
