import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';

/**
 * Task card component representing individual tasks in the Kanban board columns.
 * 
 * This component displays task information in a compact card format including title, description,
 * priority indicator, category badge, subtask progress, and assigned contacts. The card is
 * interactive and supports drag & drop functionality for moving tasks between board columns.
 * 
 * Features:
 * - Task title and truncated description display
 * - Priority visual indicator with appropriate icons
 * - Category badge with dynamic styling
 * - Subtask progress bar and completion counters
 * - Contact avatars for assigned team members
 * - Click event handling for task detail navigation
 * - Drag & drop support for task status changes
 */
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskCardComponent {
  task = input.required<Task>();
  contacts = input.required<Contact[]>();
  taskClicked = output<Task>();

  private wasDragging = false;

  /**
   * Handles click event - only opens if not dragging
   */
  onClick(event: MouseEvent): void {
    if (!this.wasDragging) {
      this.taskClicked.emit(this.task());
    }
  }

  /**
   * Handles drag start event
   */
  onDragStarted(): void {
    this.wasDragging = true;
  }

  /**
   * Handles drag end event
   */
  onDragEnded(): void {
    // Keep wasDragging true briefly to prevent click event from firing
    setTimeout(() => {
      this.wasDragging = false;
    }, 200);
  }

  /**
   * Generates CSS class name from task category for dynamic styling.
   * Converts category names to lowercase kebab-case format suitable for CSS classes.
   * @param category - The task category string (e.g., "User Story", "Technical Task")
   * @returns CSS class name in kebab-case format (e.g., "user-story", "technical-task")
   */
  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Truncates task description for card display to maintain consistent layout.
   * Limits description length and adds ellipsis for longer content to prevent
   * card height variations and maintain visual consistency across the board.
   * @param description - The full task description text
   * @returns Truncated description with ellipsis if longer than max length, or original if shorter
   */
  getShortDescription(description: string): string {
    if (!description) return '';
    const maxLength = 120;
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  /**
   * Calculates subtask completion percentage for progress bar visualization.
   * Computes the percentage of completed subtasks relative to total subtasks,
   * providing visual feedback on task progress to users.
   * @param task - The task object containing subtasks array
   * @returns Completion percentage as integer (0-100), or 0 if no subtasks exist
   */
  getSubtaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((st) => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  /**
   * Returns the count of completed subtasks for display in progress indicators.
   * Used to show "X of Y completed" style progress information to users.
   * @param task - The task object containing subtasks array
   * @returns Number of completed subtasks, or 0 if no subtasks exist
   */
  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter((st) => st.completed).length;
  }

  /**
   * Determines if all subtasks have been completed for visual status indicators.
   * Used to apply special styling or icons when a task is fully completed.
   * @param task - The task object containing subtasks array
   * @returns True if all subtasks are completed, false if none exist or some are incomplete
   */
  areAllSubtasksCompleted(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.every((st) => st.completed);
  }

  /**
   * Checks if task has incomplete subtasks for progress display logic.
   * Used to determine when to show progress indicators and incomplete task styling.
   * @param task - The task object containing subtasks array
   * @returns True if subtasks exist and some are incomplete, false otherwise
   */
  hasIncompleteSubtasks(task: Task): boolean {
    if (!task.subtasks || task.subtasks.length === 0) return false;
    return task.subtasks.some((st) => !st.completed);
  }

  /**
   * Retrieves the display color for contact avatars from the contacts array.
   * Searches the contacts list for the specified user and returns their assigned color
   * for consistent avatar styling across the application.
   * @param userId - The unique identifier of the assigned contact/user
   * @returns Hex color code for the contact's avatar, or default blue if contact not found
   */
  getContactColor(userId: string): string {
    const contact = this.contacts().find((c) => c.id === userId);
    return contact?.color || '#29abe2';
  }

  /**
   * Gets the initials for contact avatar display from the contacts array.
   * Retrieves the pre-calculated initials for the specified user to display
   * in circular avatar badges on the task card.
   * @param userId - The unique identifier of the assigned contact/user
   * @returns Two-letter initials for the contact, or "??" if contact not found
   */
  getContactInitials(userId: string): string {
    const contact = this.contacts().find((c) => c.id === userId);
    return contact?.initials || '??';
  }

  /**
   * Returns the appropriate priority icon path based on task priority level.
   * Maps priority levels to their corresponding SVG icon assets for visual
   * priority indication on task cards.
   * @param priority - The task priority level (low, medium, or high)
   * @returns File path to the appropriate priority icon SVG asset
   */
  getPriorityIcon(priority: 'low' | 'medium' | 'high'): string {
    const iconMap = {
      low: 'assets/images/low.svg',
      medium: 'assets/images/medium.svg',
      high: 'assets/images/urgent.svg',
    };
    return iconMap[priority] || iconMap['medium'];
  }
}
