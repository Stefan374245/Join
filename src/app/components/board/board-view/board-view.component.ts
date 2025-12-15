import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, CdkDropList } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../services/task.service';
import { ContactService } from '../../../services/contact.service';
import { ToastService } from '../../../services/toast.service';
import { Task } from '../../../models/task.interface';
import { Contact } from '../../../models/contact.interface';
import { Observable, map } from 'rxjs';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { AddTaskComponent } from '../../add-task/add-task.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-board-view',
  standalone: true,
imports: [CommonModule, FormsModule, DragDropModule, TaskDetailComponent, AddTaskComponent, LoadingSpinnerComponent, ClickOutsideDirective],  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss'
})
export class BoardViewComponent implements OnInit, AfterViewInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;

  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  searchQuery: string = '';
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  contacts: Contact[] = [];

    tasksLoading: boolean = true;

  triageTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];

  selectedTask: Task | null = null;
  showTaskDetail: boolean = false;

  taskToEdit: Task | null = null;
  showEditOverlay: boolean = false;

  showAddTaskOverlay: boolean = false;
  addTaskStatus: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' = 'todo';

  ngOnInit(): void {
    this.loadTasks();
    this.loadContacts();
  }

  private loadTasks(): void {
    this.tasksLoading = true;
    const minSpinnerTime = 500;
    const startTime = Date.now();
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.allTasks = tasks;
        this.filteredTasks = tasks;
        this.updateColumnArrays();
        const elapsed = Date.now() - startTime;
        const remaining = minSpinnerTime - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            this.tasksLoading = false;
            this.connectDropLists();
            console.log('📋 Loaded tasks:', tasks.length);
          }, remaining);
        } else {
          this.tasksLoading = false;
          this.connectDropLists();
          console.log('📋 Loaded tasks:', tasks.length);
        }
      },
      error: (error: any) => {
        this.tasksLoading = false;
        console.error('❌ Error loading tasks:', error);
      }
    });
  }

  private connectDropLists(): void {
    setTimeout(() => {
      if (this.dropLists && this.dropLists.length > 0) {
        const allDropListIds = this.dropLists.map(list => list.id);
        this.dropLists.forEach(dropList => {
          dropList.connectedTo = this.dropLists.filter(list => list.id !== dropList.id);
        });
      }
    }, 0);
  }

  private updateColumnArrays(): void {
    this.triageTasks = this.filteredTasks.filter(task => task.status === 'triage');
    this.todoTasks = this.filteredTasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.filteredTasks.filter(task => task.status === 'in-progress');
    this.awaitFeedbackTasks = this.filteredTasks.filter(task => task.status === 'await-feedback');
    this.doneTasks = this.filteredTasks.filter(task => task.status === 'done');

    console.log('📊 Column Arrays Updated:', {
      triage: this.triageTasks.length,
      todo: this.todoTasks.length,
      inProgress: this.inProgressTasks.length,
      awaitFeedback: this.awaitFeedbackTasks.length,
      done: this.doneTasks.length
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const allDropListIds = this.dropLists.map(list => list.id);
      console.log('🎯 Connecting drop lists:', allDropListIds);

      this.dropLists.forEach(dropList => {
        dropList.connectedTo = this.dropLists.filter(list => list.id !== dropList.id);
      });

      console.log('✅ All drop lists connected');
    }, 0);
  }

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

  getTasksByStatus(status: string): Task[] {
    switch(status) {
      case 'triage':
        return this.triageTasks;
      case 'todo':
        return this.todoTasks;
      case 'in-progress':
        return this.inProgressTasks;
      case 'await-feedback':
        return this.awaitFeedbackTasks;
      case 'done':
        return this.doneTasks;
      default:
        return [];
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredTasks = this.allTasks;
      this.updateColumnArrays();
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredTasks = this.allTasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.category.toLowerCase().includes(query)
    );
    this.updateColumnArrays();
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, targetStatus: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): void {
    const task = event.item.data as Task;
    this.logDropEvent(task, event, targetStatus);
    if (task.status === targetStatus) return this.logNoUpdate();
    const oldStatus = task.status;
    this.updateLocalTaskStatus(task.id, targetStatus);
    this.taskService.updateTaskStatus(task.id, targetStatus).subscribe({
      next: () => setTimeout(() => this.scrollToTask(task.id), 400),
      error: () => this.revertLocalTaskStatus(task.id, oldStatus)
    });
  }
  private logDropEvent(task: Task, event: CdkDragDrop<Task[]>, targetStatus: Task['status']) {
    console.log('🔍 DROP EVENT:', {
      task: task.title, currentStatus: task.status, targetStatus,
      previousContainer: event.previousContainer.id, currentContainer: event.container.id,
      sameContainer: event.previousContainer === event.container
    });
  }

  private logNoUpdate() {
    console.log('ℹ️ Task dropped in same column - no update needed');
  }

  private updateLocalTaskStatus(id: string, status: Task['status']) {
    const i = this.allTasks.findIndex(t => t.id === id);
    if (i !== -1) {
      this.allTasks[i].status = status;
      this.filteredTasks = [...this.allTasks];
      this.updateColumnArrays();
      console.log('✅ Local update done, column arrays updated');
    }
  }

  private revertLocalTaskStatus(id: string, status: Task['status']) {
    console.error('❌ Error updating task status');
    this.updateLocalTaskStatus(id, status);
  }

  private scrollToTask(taskId: string): void {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  openAddTaskModal(status?: string): void {
    if (status) {
      this.addTaskStatus = status as 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done';
    } else {
      this.addTaskStatus = 'todo';
    }

    this.showAddTaskOverlay = true;
  }

  onAddButtonHover(event: MouseEvent, isHover: boolean): void {
    const button = event.currentTarget as HTMLButtonElement;
    const img = button.querySelector('img');
    if (img) {
      img.src = isHover
        ? '/assets/images/taskPlusHover.svg'
        : '/assets/images/taskPlus.svg';
    }
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = task;
    this.showTaskDetail = true;
  }

  closeTaskDetail(): void {
    this.showTaskDetail = false;
    this.selectedTask = null;
  }

  onEditTask(task: Task): void {
    this.taskToEdit = task;
    this.showEditOverlay = true;
    this.closeTaskDetail();
  }

  closeEditOverlay(): void {
    this.showEditOverlay = false;
    this.taskToEdit = null;
  }

  onTaskSaved(task: Task): void {
    console.log('✅ Task saved:', task);
    this.closeEditOverlay();
  }

  closeAddTaskOverlay(): void {
    this.showAddTaskOverlay = false;
    this.addTaskStatus = 'todo';
  }

  onTaskCreated(task: Task): void {
    console.log('✅ New task created:', task);
    this.closeAddTaskOverlay();
  }

  onDeleteTask(taskId: string): void {
    const taskToDelete = this.allTasks.find(t => t.id === taskId);
    const taskTitle = taskToDelete?.title || 'Task';

    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        console.log('✅ Task deleted successfully');
        this.toastService.showTaskDeleted(taskTitle);
        this.closeTaskDetail();
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.toastService.showTaskDeleteError();
      }
    });
  }

  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  getShortDescription(description: string): string {
    if (!description) return '';
    const maxLength = 48;
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  getSubtaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(st => st.completed).length;
  }

  areAllSubtasksCompleted(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.every(st => st.completed);
  }

  hasIncompleteSubtasks(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.some(st => !st.completed);
  }

  getContactColor(userId: string): string {
    const contact = this.contacts.find(c => c.id === userId);
    return contact?.color || '#29abe2';
  }

  getContactInitials(userId: string): string {
    const contact = this.contacts.find(c => c.id === userId);
    return contact?.initials || '??';
  }

  getPriorityIcon(priority: 'low' | 'medium' | 'high'): string {
    const iconMap = {
      'low': '/assets/images/low.svg',
      'medium': '/assets/images/medium.svg',
      'high': '/assets/images/urgent.svg'
    };
    return iconMap[priority] || iconMap['medium'];
  }
}


