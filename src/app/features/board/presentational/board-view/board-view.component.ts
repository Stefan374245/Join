
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

  /**
   * Angular lifecycle hook for component initialization.
   *
   * Orchestrates the startup sequence by loading essential data and setting up
   * interactive features. This ensures the board is fully functional when
   * users interact with it.
   *
   * Initialization sequence:
   * 1. Load all tasks from Firestore
   * 2. Load contact data for task assignments
   * 3. Initialize auto-scroll functionality for drag operations
   */
  ngOnInit(): void {
    this.loadTasks();
    this.loadContacts();
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
   * Loads all tasks from the TaskService and initializes the board data.
   * 
   * This method handles the complete task loading lifecycle including loading states,
   * minimum spinner display time for better UX, task organization by status, and
   * drop list connection setup for drag & drop functionality.
   * 
   * Features:
   * - Minimum 500ms loading indicator for perceived performance
   * - Automatic task filtering and column organization
   * - Drop list connection setup after data loading
   * - Comprehensive error handling with user feedback
   */
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
          console.log(
            "✅ Connected drop lists:",
            allDropLists.map((l) => l.id)
          );
        }
      }
    }, 0);
  }

  /**
   * Organizes filtered tasks into status-specific arrays for column rendering.
   * 
   * This method processes the filtered tasks and distributes them into separate arrays
   * based on their status property. Each column component receives its corresponding
   * task array for rendering, enabling efficient change detection and UI updates.
   * 
   * Task status categories:
   * - Triage: Initial task assessment
   * - Todo: Ready for development
   * - In Progress: Currently being worked on
   * - Await Feedback: Waiting for review or input
   * - Done: Completed tasks
   */
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

  /**
   * Angular lifecycle hook called after the component's view has been fully initialized.
   * 
   * This method is responsible for setting up drag & drop connections between all board columns
   * after the view children (BoardColumnComponent instances) have been created and initialized.
   * It ensures that tasks can be dragged between any columns by establishing bidirectional
   * connections between all drop list zones.
   * 
   * The method uses setTimeout with 0ms delay to ensure that ViewChildren query has completed
   * and all column components are properly instantiated before attempting to access their
   * drop list references.
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.boardColumns() && this.boardColumns().length > 0) {
        const allDropLists = this.boardColumns()
          .map((col) => col.dropList())
          .filter((list) => !!list);
        console.log(
          "🎯 Connecting drop lists:",
          allDropLists.map((l) => l!.id)
        );

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

  /**
   * Loads contact data from the ContactService for task assignment functionality.
   * 
   * This method fetches all available contacts from the data source and stores them
   * in the component's contacts array. Contact data is essential for displaying
   * assigned users on task cards and enabling contact selection during task editing.
   * 
   * The method includes comprehensive error handling to gracefully manage network
   * or data access issues without breaking the application flow.
   */
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

  /**
   * Retrieves tasks filtered by their status from the appropriate status-specific array.
   * 
   * This utility method provides a centralized way to access tasks by status, returning
   * the corresponding pre-filtered array based on the status parameter. Each status
   * corresponds to a specific column in the Kanban board layout.
   * 
   * @param status - The task status to filter by ('triage', 'todo', 'in-progress', 'await-feedback', 'done')
   * @returns Array of tasks matching the specified status, or empty array for invalid status
   */
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

  /**
   * Performs real-time search filtering across all tasks based on the search query.
   * 
   * This method filters tasks by searching through title, description, and category fields
   * using case-insensitive matching. When the search query is empty, all tasks are displayed.
   * After filtering, the method updates column arrays to reflect the search results across
   * all board columns.
   * 
   * Search functionality:
   * - Searches in task title, description, and category fields
   * - Case-insensitive matching for better user experience
   * - Real-time filtering as user types
   * - Automatic reset when search query is cleared
   * - Updates all column displays immediately after filtering
   */
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

  /**
   * Handles drag and drop events for moving tasks between board columns.
   * 
   * This method processes CDK drag-drop events when tasks are moved between different
   * status columns. It implements optimistic UI updates for immediate user feedback
   * while performing the actual status update in the background. The method includes
   * comprehensive error handling with automatic rollback functionality.
   * 
   * Process flow:
   * 1. Extract task and target status from the drop event
   * 2. Log the drop event for debugging purposes
   * 3. Check if the task is dropped in the same column (no action needed)
   * 4. Perform optimistic local update for immediate UI feedback
   * 5. Sync the change with the backend service
   * 6. Scroll to the dropped task location on success
   * 7. Revert the local change if backend update fails
   * 
   * @param event - The CDK drag-drop event containing source and target information
   * @param targetStatus - The target status/column where the task was dropped
   */
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
   * Updates the task status locally for optimistic UI updates during drag and drop operations.
   * 
   * This method performs immediate local updates to the task status without waiting for
   * backend confirmation, providing instant visual feedback to users. It updates both
   * the main tasks array and the filtered tasks array, then reorganizes column arrays
   * to reflect the status change in the UI.
   * 
   * This optimistic update approach significantly improves the user experience by
   * eliminating the perceived lag between user action and UI response.
   * 
   * @param id - The unique identifier of the task to update
   * @param status - The new status to assign to the task
   */
  private updateLocalTaskStatus(id: string, status: Task['status']) {
    const i = this.allTasks.findIndex((t) => t.id === id);
    if (i !== -1) {
      this.allTasks[i].status = status;
      this.filteredTasks = [...this.allTasks];
      this.updateColumnArrays();
      console.log('✅ Local update done, column arrays updated');
    }
  }

  /**
   * Reverts a task's status to its previous value when backend update fails.
   * 
   * This method is part of the optimistic update error handling strategy. When a
   * backend status update fails after an optimistic local update has already been
   * applied, this method restores the task to its previous status to maintain
   * data consistency between the UI and the backend.
   * 
   * The revert operation uses the same local update mechanism to ensure the UI
   * properly reflects the rollback across all column displays.
   * 
   * @param id - The unique identifier of the task to revert
   * @param status - The previous status to restore
   */
  private revertLocalTaskStatus(id: string, status: Task['status']) {
    console.error('❌ Error updating task status');
    this.updateLocalTaskStatus(id, status);
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
   * Handles the deletion of a task by its ID.
   * 
   * Finds the task in the local task list, attempts to delete it via the task service,
   * and displays appropriate toast notifications based on the operation result.
   * Closes the task detail view upon successful deletion.
   * 
   * @param taskId - The unique identifier of the task to delete
   * 
   * @remarks
   * - Shows a success toast with the task title if deletion succeeds
   * - Shows an error toast if deletion fails
   * - Logs the operation result to the console
   * 
   * @returns void
   */
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
