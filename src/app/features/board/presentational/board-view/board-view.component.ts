
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
/**
 * Main board view component that implements a Kanban-style task management interface.
 * 
 * This component provides a comprehensive task board with drag-and-drop functionality,
 * task filtering, and CRUD operations. It manages the visualization and interaction
 * of tasks across multiple status columns (Triage, Todo, In Progress, Await Feedback, Done).
 * 
 * @remarks
 * Key features:
 * - Drag-and-drop task movement between columns using Angular CDK
 * - Auto-scroll functionality during drag operations near viewport edges
 * - Real-time task filtering and search capabilities
 * - Task detail viewing and editing through overlay modals
 * - Integration with Firestore for persistent data storage
 * - Optimized loading states with minimum spinner duration for better UX
 * - Toast notifications for user feedback on CRUD operations
 * 
 * The component implements Angular lifecycle hooks for proper initialization
 * and cleanup, including automatic connection of drop lists after view initialization
 * and cleanup of auto-scroll intervals on component destruction.
 * 
 * @example
 * ```html
 * <app-board-view></app-board-view>
 * ```
 * 
 * @implements {OnInit} - Initializes tasks, contacts, and auto-scroll functionality
 * @implements {AfterViewInit} - Connects drag-and-drop lists after view initialization
 * @implements {OnDestroy} - Cleans up auto-scroll intervals and event listeners
 */
export class BoardViewComponent implements OnInit, AfterViewInit, OnDestroy {
  boardColumns = viewChildren(BoardColumnComponent);

  public taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  tasks = this.taskService.filteredTasksByStatus;
  loading = this.taskService.loading;
  allTasks = this.taskService.tasks;
  
  contacts = this.contactService.contacts;

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
    { id: 'triage', title: 'Triage', getTasks: () => this.tasks().triage },
    { id: 'todo', title: 'To do', getTasks: () => this.tasks().todo },
    { id: 'in-progress', title: 'In progress', getTasks: () => this.tasks().inProgress },
    { id: 'await-feedback', title: 'Await feedback', getTasks: () => this.tasks().awaitFeedback },
    { id: 'done', title: 'Done', getTasks: () => this.tasks().done },
  ];

  /**
   * Angular lifecycle hook for component initialization.
   * Loads tasks and contacts, then initializes auto-scroll functionality.
   */
  ngOnInit(): void {
    this.contactService.loadContactsAsync();
    this.initAutoScroll();
  }

  /**
   * Angular lifecycle hook for component cleanup.
   * Clears auto-scroll intervals to prevent memory leaks and ensure proper cleanup.
   */
  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  /**
   * Initializes auto-scroll functionality for drag and touch operations.
   *
   * Sets up event listeners for drag-over and touch-move events to enable
   * automatic scrolling when users drag tasks near the viewport edges.
   * This improves UX by allowing users to access off-screen drop zones.
   */
  private initAutoScroll(): void {
    document.addEventListener('dragover', this.handleDragOver.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
  }

  /**
   * Handles drag-over events to trigger auto-scroll behavior during task dragging.
   *
   * @param event - The drag event containing cursor position information
   */
  private handleDragOver(event: DragEvent): void {
    this.checkAndScroll(event.clientY);
  }

  /**
   * Handles touch-move events to trigger auto-scroll behavior during touch-based dragging.
   *
   * @param event - The touch event containing touch position information
   */
  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.checkAndScroll(event.touches[0].clientY);
    }
  }

  /**
   * Checks cursor/touch position and initiates automatic scrolling when near viewport edges.
   *
   * This method determines if the user's cursor or touch is within the scroll threshold
   * zones at the top or bottom of the viewport and starts appropriate scrolling behavior.
   *
   * @param clientY - The vertical position of the cursor/touch relative to viewport
   */
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

  /**
   * Establishes drag & drop connections between all board columns.
   * 
   * This method creates bidirectional connections between all column drop zones,
   * enabling tasks to be dragged between any columns. It uses Angular's ViewChildren
   * to access column components and configure their CDK drop list connections.
   * 
   * The method includes proper timing with setTimeout to ensure all view children
   * are properly initialized before attempting connections.
   */
  private connectDropLists(): void {
    setTimeout(() => {
      if (this.boardColumns() && this.boardColumns().length > 0) {
        const allDropLists = this.boardColumns()
          .map((col) => col.dropList())
          .filter((list) => !!list);

        if (allDropLists.length > 0) {
          this.boardColumns().forEach((column) => {
            if (column.dropList()) {
              column.dropList()!.connectedTo = allDropLists.filter(
                (list) => list!.id !== column.dropList()!.id
              );
            }
          });
        }
      }
    }, 0);
  }

  /**
   * Angular lifecycle hook called after the component's view has been fully initialized.
   * 
   * Sets up drag & drop connections between all board columns after ViewChildren are available.
   */
  ngAfterViewInit(): void {
    this.connectDropLists();
  }

  /**
   * Handles drag and drop events using TaskService optimistic updates.
   */
  async onTaskDrop(event: CdkDragDrop<Task[]>, targetStatus: string): Promise<void> {
    const task = event.item.data as Task;
    const status = targetStatus as 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done';
    
    this.logDropEvent(task, event, status);
    
    if (task.status === status) {
      this.logNoUpdate();
      return;
    }
    
    try {
      await this.taskService.updateTaskStatusOptimistic(task.id, status);
      console.log('✅ Task status updated optimistically');
      setTimeout(() => this.scrollToTask(task.id), 400);
    } catch (error) {
      console.error('❌ Error updating task status:', error);
    }
  }

  /**
   * Logs detailed information about drag and drop events for debugging and monitoring.
   * 
   * This utility method provides comprehensive logging of drop events, capturing all
   * relevant information about the task movement including source and destination details.
   * The logged information is valuable for debugging drag-and-drop issues and monitoring
   * user interactions with the board.
   * 
   * @param task - The task object being moved
   * @param event - The CDK drag-drop event containing container information
   * @param targetStatus - The target status/column for the task
   */
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

  /**
   * Logs information when a task is dropped in the same column where it originated.
   * 
   * This method is called when a drag and drop operation results in no actual status
   * change because the task was dropped back into its original column. It helps with
   * debugging and understanding user interactions that don't result in data changes.
   */
  private logNoUpdate() {
    console.log('ℹ️ Task dropped in same column - no update needed');
  }

  /**
   * Scrolls to and highlights a specific task element after a drag and drop operation.
   * 
   * This method enhances the user experience by automatically scrolling to show a task
   * that has been moved to a new column, especially when the destination is outside the
   * current viewport. It also applies a temporary highlight effect to draw attention
   * to the moved task.
   * 
   * Features:
   * - Intelligent scrolling only when the task is outside the visible area
   * - Smooth scroll animation for better visual experience
   * - Temporary visual highlight effect lasting 1.5 seconds
   * - Automatic cleanup of highlight styling
   * - Graceful handling of missing DOM elements
   * 
   * @param taskId - The unique identifier of the task to scroll to and highlight
   */
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

  /**
   * Opens the add task modal overlay with optional pre-selected status.
   * 
   * This method displays the task creation form in an overlay modal. When called
   * from a specific column's add button, the status parameter pre-selects the
   * corresponding status for the new task. If no status is provided, it defaults
   * to 'todo' status.
   * 
   * The pre-selection of status improves user experience by eliminating the need
   * to manually select the status when adding tasks directly from a column.
   * 
   * @param status - Optional status to pre-select for the new task
   */
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

  /**
   * Handles hover state changes for add task buttons to provide visual feedback.
   * 
   * This method creates interactive visual feedback by swapping the button icon
   * between normal and hover states when users move their mouse over add task buttons.
   * The icon swap provides immediate visual confirmation that the button is interactive.
   * 
   * The method dynamically updates the image source to show either the standard
   * add icon or the hover variant, enhancing the overall user experience with
   * responsive visual cues.
   * 
   * @param event - The mouse event containing the target button element
   * @param isHover - Boolean indicating whether mouse is entering (true) or leaving (false)
   */
  onAddButtonHover(event: MouseEvent, isHover: boolean): void {
    const button = event.currentTarget as HTMLButtonElement;
    const img = button.querySelector('img');
    if (img) {
      img.src = isHover
        ? 'assets/images/taskPlusHover.svg'
        : 'assets/images/taskPlus.svg';
    }
  }

  /**
   * Opens the task detail overlay for viewing comprehensive task information.
   * 
   * This method displays a detailed view of the selected task in a modal overlay,
   * allowing users to view all task properties including subtasks, assignments,
   * priority, and full description. The overlay provides options for editing
   * or deleting the task.
   * 
   * @param task - The task object to display in the detail view
   */
  openTaskDetail(task: Task): void {
    this.selectedTask = task;
    this.showTaskDetail = true;
  }

  /**
   * Closes the task detail overlay and clears the selected task.
   * 
   * This method hides the task detail modal and resets the selected task state
   * to null, ensuring proper cleanup and preventing memory leaks from retained
   * task references.
   */
  closeTaskDetail(): void {
    this.showTaskDetail = false;
    this.selectedTask = null;
  }

  /**
   * Transitions from task detail view to task edit mode.
   * 
   * This method initiates the task editing flow by setting the task to be edited,
   * opening the edit overlay modal, and closing the detail view. The transition
   * provides a seamless user experience from viewing to editing task information.
   * 
   * @param task - The task object to be edited
   */
  onEditTask(task: Task): void {
    this.taskToEdit = task;
    this.showEditOverlay = true;
    this.closeTaskDetail();
  }

  /**
   * Closes the task edit overlay and clears the task being edited.
   * 
   * This method hides the edit modal and resets the edit state, ensuring proper
   * cleanup when the user cancels editing or completes the edit operation.
   * The method prevents memory leaks by clearing the task reference.
   */
  closeEditOverlay(): void {
    this.showEditOverlay = false;
    this.taskToEdit = null;
  }

  /**
   * Handles the successful completion of task editing operations.
   * 
   * This method is called when a task has been successfully saved after editing.
   * It logs the save operation for debugging purposes and closes the edit overlay
   * to return the user to the main board view.
   * 
   * The task data is automatically synchronized through the reactive data flow,
   * so no manual UI updates are required in this method.
   * 
   * @param task - The updated task object that was saved
   */
  onTaskSaved(task: Task): void {
    console.log('✅ Task saved:', task);
    this.closeEditOverlay();
  }

  /**
   * Closes the add task overlay and resets the task status to 'todo'.
   * 
   * @returns {void}
   */
  closeAddTaskOverlay(): void {
    this.showAddTaskOverlay = false;
    this.addTaskStatus = 'todo';
  }

  /**
   * Handles the event when a new task is created.
   * Logs the created task to the console and closes the add task overlay.
   * 
   * @param task - The newly created task object
   * @returns void
   */
  onTaskCreated(task: Task): void {
    console.log('✅ New task created:', task);
    this.closeAddTaskOverlay();
  }

  /**
   * Handles the deletion of a task by its ID using TaskService signals.
   */
  async onDeleteTask(taskId: string): Promise<void> {
    const taskToDelete = this.taskService.findTaskById(taskId);
    const taskTitle = taskToDelete?.title || 'Task';

    try {
      await this.taskService.deleteTask(taskId);
      console.log('✅ Task deleted successfully');
      this.toastService.showTaskDeleted(taskTitle);
      this.closeTaskDetail();
    } catch (error) {
      console.error('Error deleting task:', error);
      this.toastService.showTaskDeleteError();
    }
  }
}
