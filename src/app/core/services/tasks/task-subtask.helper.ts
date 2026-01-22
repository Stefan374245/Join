import { Task, Subtask } from '../../models/task.interface';

/**
 * Helper functions for subtask operations
 */

/**
 * Updates subtask completion status
 * @param task - Task containing subtask
 * @param subtaskId - Subtask ID
 * @param completed - Completion status
 * @returns Updated subtasks array
 */
export function updateSubtaskInTask(
  task: Task,
  subtaskId: string,
  completed: boolean
): Subtask[] {
  validateTaskHasSubtasks(task);
  
  const subtask = findSubtaskById(task.subtasks, subtaskId);
  if (!subtask) {
    throw new Error('Subtask not found');
  }

  return task.subtasks.map(st =>
    st.id === subtaskId ? { ...st, completed } : st
  );
}

/**
 * Validates task has subtasks
 * @param task - Task to validate
 */
function validateTaskHasSubtasks(task: Task): void {
  if (!task || !task.subtasks) {
    throw new Error('Task or subtasks not found');
  }
}

/**
 * Finds subtask by ID
 * @param subtasks - Subtasks array
 * @param subtaskId - Subtask ID
 * @returns Found subtask or undefined
 */
function findSubtaskById(subtasks: Subtask[], subtaskId: string): Subtask | undefined {
  return subtasks.find(st => st.id === subtaskId);
}

/**
 * Adds subtask to task
 * @param task - Task to add subtask to
 * @param subtask - Subtask to add
 * @returns Updated subtasks array
 */
export function addSubtaskToTaskList(task: Task, subtask: Subtask): Subtask[] {
  if (!task) {
    throw new Error('Task not found');
  }

  return [...task.subtasks, subtask];
}

/**
 * Removes subtask from task
 * @param task - Task to remove subtask from
 * @param subtaskId - Subtask ID to remove
 * @returns Updated subtasks array
 */
export function removeSubtaskFromTaskList(task: Task, subtaskId: string): Subtask[] {
  if (!task) {
    throw new Error('Task not found');
  }

  return task.subtasks.filter(st => st.id !== subtaskId);
}
