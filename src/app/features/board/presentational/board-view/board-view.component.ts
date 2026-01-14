import {
  Component,
  OnInit,
  inject,
  viewChildren,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { Observable, map } from 'rxjs';
import { TaskDetailComponent } from '../../components/task-detail/task-detail.component';
import { AddTaskViewComponent } from '../../../add-task/presentational/add-task-view/add-task-view.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { BoardColumnComponent } from '../../components/board-column/board-column.component';

interface BoardColumn {
  id: string;
  title: string;
  getTasks: () => Task[];
}

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskDetailComponent,
    AddTaskViewComponent,
    LoadingSpinnerComponent,
    ClickOutsideDirective,
    BoardColumnComponent,
  ],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss',
})
export class BoardViewComponent implements OnInit, AfterViewInit, OnDestroy {
  boardColumns = viewChildren(BoardColumnComponent);

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
  addTaskStatus: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' =
    'todo';

  private autoScrollInterval: any = null;
  private readonly scrollSpeed = 20;
  private readonly scrollThreshold = 100;

  columns: BoardColumn[] = [
    { id: 'triage', title: 'Triage', getTasks: () => this.triageTasks },
    { id: 'todo', title: 'To do', getTasks: () => this.todoTasks },
    { id: 'in-progress', title: 'In progress', getTasks: () => this.inProgressTasks },
    { id: 'await-feedback', title: 'Await feedback', getTasks: () => this.awaitFeedbackTasks },
    { id: 'done', title: 'Done', getTasks: () => this.doneTasks },
  ];

  ngOnInit(): void {
    this.loadTasks();
    this.loadContacts();
    this.initAutoScroll();
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  private initAutoScroll(): void {
    document.addEventListener('dragover', this.handleDragOver.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
  }

  private handleDragOver(event: DragEvent): void {
    this.checkAndScroll(event.clientY);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.checkAndScroll(event.touches[0].clientY);
    }
  }

  private checkAndScroll(clientY: number): void {
    const viewportHeight = window.innerHeight;
    const container = document.querySelector('.board-container');
    
    if (!container) return;

    if (clientY > viewportHeight - this.scrollThreshold) {
      this.startAutoScroll('down', container);
    }
    else if (clientY < this.scrollThreshold) {
      this.startAutoScroll('up', container);
    }
    else {
      this.stopAutoScroll();
    }
  }

  private startAutoScroll(direction: 'up' | 'down', container: Element): void {
    if (this.autoScrollInterval) {
      return;
    }

    this.autoScrollInterval = setInterval(() => {
      if (direction === 'down') {
        container.scrollTop += this.scrollSpeed;
      } else {
        container.scrollTop -= this.scrollSpeed;
      }
    }, 16);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
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
      },
    });
  }

  private connectDropLists(): void {
    setTimeout(() => {
      if (this.boardColumns() && this.boardColumns().length > 0) {
        const allDropLists = this.boardColumns().map(col => col.dropList()).filter(list => !!list);
        
        if (allDropLists.length > 0) {
          this.boardColumns().forEach((column) => {
            if (column.dropList()) {
              column.dropList()!.connectedTo = allDropLists.filter(
                (list) => list!.id !== column.dropList()!.id
              );
            }
          });
          console.log('✅ Connected drop lists:', allDropLists.map(l => l.id));
        }
      }
    }, 0);
  }

  private updateColumnArrays(): void {
    this.triageTasks = this.filteredTasks.filter(
      (task) => task.status === 'triage'
    );
    this.todoTasks = this.filteredTasks.filter(
      (task) => task.status === 'todo'
    );
    this.inProgressTasks = this.filteredTasks.filter(
      (task) => task.status === 'in-progress'
    );
    this.awaitFeedbackTasks = this.filteredTasks.filter(
      (task) => task.status === 'await-feedback'
    );
    this.doneTasks = this.filteredTasks.filter(
      (task) => task.status === 'done'
    );

    console.log('📊 Column Arrays Updated:', {
      triage: this.triageTasks.length,
      todo: this.todoTasks.length,
      inProgress: this.inProgressTasks.length,
      awaitFeedback: this.awaitFeedbackTasks.length,
      done: this.doneTasks.length,
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.boardColumns() && this.boardColumns().length > 0) {
        const allDropLists = this.boardColumns().map(col => col.dropList()).filter(list => !!list);
        console.log('🎯 Connecting drop lists:', allDropLists.map(l => l!.id));

        this.boardColumns().forEach((column) => {
          if (column.dropList()) {
            column.dropList()!.connectedTo = allDropLists.filter(
              (list) => list!.id !== column.dropList()!.id
            );
          }
        });

        console.log('✅ All drop lists connected');
      }
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
      },
    });
  }

  getTasksByStatus(status: string): Task[] {
    switch (status) {
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
    this.filteredTasks = this.allTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
    );
    this.updateColumnArrays();
  }

  onTaskDrop(
    event: CdkDragDrop<Task[]>,
    targetStatus: string
  ): void {
    const task = event.item.data as Task;
    const status = targetStatus as 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done';
    this.logDropEvent(task, event, status);
    if (task.status === status) return this.logNoUpdate();
    const oldStatus = task.status;
    this.updateLocalTaskStatus(task.id, status);
    this.taskService.updateTaskStatus(task.id, status).subscribe({
      next: () => setTimeout(() => this.scrollToTask(task.id), 400),
      error: () => this.revertLocalTaskStatus(task.id, oldStatus),
    });
  }
  private logDropEvent(
    task: Task,
    event: CdkDragDrop<Task[]>,
    targetStatus: Task['status']
  ) {
    console.log('🔍 DROP EVENT:', {
      task: task.title,
      currentStatus: task.status,
      targetStatus,
      previousContainer: event.previousContainer.id,
      currentContainer: event.container.id,
      sameContainer: event.previousContainer === event.container,
    });
  }

  private logNoUpdate() {
    console.log('ℹ️ Task dropped in same column - no update needed');
  }

  private updateLocalTaskStatus(id: string, status: Task['status']) {
    const i = this.allTasks.findIndex((t) => t.id === id);
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
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    if (taskElement) {
      const columnContent = taskElement.closest('.column-content');
      if (columnContent) {
        const elementRect = taskElement.getBoundingClientRect();
        const containerRect = columnContent.getBoundingClientRect();
        
        if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
          taskElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
        
        setTimeout(() => {
          taskElement.classList.add('task-just-dropped');
          setTimeout(() => {
            taskElement.classList.remove('task-just-dropped');
          }, 1500);
        }, 300);
      }
    }
  }

  openAddTaskModal(status?: string): void {
    if (status) {
      this.addTaskStatus = status as
        | 'triage'
        | 'todo'
        | 'in-progress'
        | 'await-feedback'
        | 'done';
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
        ? 'assets/images/taskPlusHover.svg'
        : 'assets/images/taskPlus.svg';
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
    const taskToDelete = this.allTasks.find((t) => t.id === taskId);
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
      },
    });
  }
}
