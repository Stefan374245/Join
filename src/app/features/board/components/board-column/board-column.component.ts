import { Component, input, output, ViewEncapsulation, viewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { TaskCardComponent } from '../task-card/task-card.component';

/**
 * Board column component representing individual status columns in the Kanban board.
 * 
 * This component manages a collection of tasks organized by status (e.g., "To Do", "In Progress", 
 * "Awaiting Feedback", "Done"). It provides drag & drop functionality for moving tasks between 
 * columns and handles task organization within the column. The component displays a column header 
 * with the status title and renders task cards for all tasks matching the column's status.
 * 
 * Features:
 * - Column header with status title display
 * - Drag & drop zone for task reordering and status changes
 * - Task card rendering with full task information
 * - Task filtering by status within the column
 * - Event emission for task detail navigation
 * - Visual feedback during drag operations
 * - Empty state handling for columns without tasks
 */
@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BoardColumnComponent implements AfterViewInit {

  constructor() {
    effect(() => {
      const dropList = this.dropList();
      const connected = this.connectedDropLists();
      if (dropList && connected.length > 0) {
        console.log('[effect] BoardColumnComponent: updating dropList.connectedTo', dropList.id, connected.map(c => c.id));
        dropList.connectedTo = connected;
      }
    });
  }
  dropList = viewChild.required<CdkDropList>(CdkDropList);
  
  columnId = input.required<string>();
  title = input.required<string>();
  tasks = input.required<Task[]>();
  contacts = input.required<Contact[]>();
  loading = input<boolean>(false);
  connectedDropLists = input<CdkDropList[]>([]);
  
  taskDropped = output<{ event: CdkDragDrop<Task[]>, status: string }>();
  addTaskClicked = output<string>();
  taskClicked = output<Task>();
  addButtonHover = output<{ event: MouseEvent, isHover: boolean }>();

  /**
   * Angular lifecycle hook called after view initialization.
   * Sets up the drag & drop connection registry for cross-column task movement.
   * This ensures that tasks can be dragged between different board columns.
   */
  ngAfterViewInit(): void {
    if (this.dropList() && this.connectedDropLists().length > 0) {
      this.dropList()!.connectedTo = this.connectedDropLists();
    }
  }

  /**
   * Handles drag & drop events for task movement between columns or reordering within columns.
   * 
   * This method processes CDK drag-drop events and emits the appropriate action based on whether
   * the task was moved within the same column (reorder) or to a different column (status change).
   * It determines the source and destination contexts to maintain proper task organization.
   * 
   * @param event - The CDK drag-drop event containing source, destination, and task information
   */
 onTaskDrop(event: CdkDragDrop<Task[]>): void {
  this.taskDropped.emit({ event, status: event.container.id });
}

  /**
   * Handles add task button clicks and emits the column status for task creation.
   * This enables users to create new tasks directly within a specific status column,
   * pre-setting the task status based on the column where the add button was clicked.
   */
  onAddTaskClick(): void {
    this.addTaskClicked.emit(this.columnId());
  }

  /**
   * Propagates task click events from child task cards to parent board component.
   * This enables centralized handling of task detail view navigation and maintains
   * the event flow from task card through column to the main board view.
   * 
   * @param task - The task object that was clicked for detail viewing
   */
  onTaskClick(task: Task): void {
    this.taskClicked.emit(task);
  }

  /**
   * Handles hover events on the add task button for visual feedback and tooltips.
   * Emits hover state changes to enable parent components to show contextual information
   * or visual enhancements when users hover over the add task functionality.
   * 
   * @param event - The mouse event containing position and target information
   * @param isHover - Boolean indicating whether the mouse is entering (true) or leaving (false) the button
   */
  onAddButtonHover(event: MouseEvent, isHover: boolean): void {
    this.addButtonHover.emit({ event, isHover });
  }
}
