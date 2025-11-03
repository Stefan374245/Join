import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { ContactService } from '../../../services/contact.service';
import { Task } from '../../../models/task.interface';
import { Contact } from '../../../models/contact.interface';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss'
})
export class BoardViewComponent implements OnInit {
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private router = inject(Router);

  searchQuery: string = '';
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  contacts: Contact[] = [];

  ngOnInit(): void {
    this.loadTasks();
    this.loadContacts();
  }

  /**
   * Load all tasks from TaskService
   */
  private loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.allTasks = tasks;
        this.filteredTasks = tasks;
        console.log('📋 Loaded tasks:', tasks.length);
      },
      error: (error: any) => {
        console.error('❌ Error loading tasks:', error);
      }
    });
  }

  /**
   * Load all contacts
   */
  private loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (contacts: Contact[]) => {
        this.contacts = contacts;
        console.log('👥 Loaded contacts:', contacts.length);
      },
      error: (error: any) => {
        console.error('❌ Error loading contacts:', error);
      }
    });
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: string): Task[] {
    // Map status to match our Task interface
    let taskStatus: 'todo' | 'in-progress' | 'done' = 'todo';
    
    switch(status) {
      case 'todo':
      case 'triage':
        taskStatus = 'todo';
        break;
      case 'in-progress':
        taskStatus = 'in-progress';
        break;
      case 'await-feedback':
        // For now, we don't have this status, so return empty
        return [];
      case 'done':
        taskStatus = 'done';
        break;
    }

    return this.filteredTasks.filter(task => task.status === taskStatus);
  }

  /**
   * Search/filter tasks
   */
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredTasks = this.allTasks;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredTasks = this.allTasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.category.toLowerCase().includes(query)
    );
  }

  /**
   * Open Add Task modal/page
   */
  openAddTaskModal(status?: string): void {
    // Navigate to add-task page
    // TODO: Later we can pass the status as query param
    this.router.navigate(['/add-task']);
  }

  /**
   * Open task detail view
   */
  openTaskDetail(task: Task): void {
    // TODO: Open task detail modal or navigate to detail page
    console.log('Opening task detail:', task);
  }

  /**
   * Get category CSS class for styling
   */
  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get shortened description for preview
   */
  getShortDescription(description: string): string {
    if (!description) return '';
    const maxLength = 80;
    return description.length > maxLength 
      ? description.substring(0, maxLength) + '...' 
      : description;
  }

  /**
   * Calculate subtask progress percentage
   */
  getSubtaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  /**
   * Get number of completed subtasks
   */
  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(st => st.completed).length;
  }

  /**
   * Get contact color by ID
   */
  getContactColor(userId: string): string {
    const contact = this.contacts.find(c => c.id === userId);
    return contact?.color || '#29abe2';
  }

  /**
   * Get contact initials by ID
   */
  getContactInitials(userId: string): string {
    const contact = this.contacts.find(c => c.id === userId);
    return contact?.initials || '??';
  }

  /**
   * Get priority icon path
   */
  getPriorityIcon(priority: 'low' | 'medium' | 'high'): string {
    const iconMap = {
      'low': 'assets/images/low.svg',
      'medium': 'assets/images/medium.svg',
      'high': 'assets/images/urgent.svg'
    };
    return iconMap[priority] || iconMap['medium'];
  }
}

