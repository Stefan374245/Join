import { WritableSignal } from '@angular/core';
import { Task } from '../../models/task.interface';

/**
 * Helper functions for optimistic UI updates
 */

/**
 * Performs optimistic update on task status
 * @param tasksSignal - Signal containing tasks
 * @param taskId - Task ID
 * @param newStatus - New status
 * @returns Updated task and revert function
 */
export function performOptimisticStatusUpdate(
  tasksSignal: WritableSignal<Task[]>,
  taskId: string,
  newStatus: Task['status']
): { updatedTask: Task; revertFn: () => void } {
  const currentTasks = tasksSignal();
  const taskIndex = findTaskIndex(currentTasks, taskId);

  if (taskIndex === -1) {
    throw new Error('Task not found');
  }

  const oldStatus = currentTasks[taskIndex].status;
  const updatedTask = createUpdatedTask(currentTasks[taskIndex], newStatus);
  
  applyOptimisticUpdate(tasksSignal, currentTasks, taskIndex, updatedTask);

  return {
    updatedTask,
    revertFn: () => revertOptimisticUpdate(tasksSignal, taskId, oldStatus)
  };
}

/**
 * Finds task index in array
 * @param tasks - Array of tasks
 * @param taskId - Task ID
 * @returns Task index or -1
 */
function findTaskIndex(tasks: Task[], taskId: string): number {
  return tasks.findIndex(t => t.id === taskId);
}

/**
 * Creates updated task with new status
 * @param task - Original task
 * @param newStatus - New status
 * @returns Updated task
 */
function createUpdatedTask(task: Task, newStatus: Task['status']): Task {
  return {
    ...task,
    status: newStatus,
    updatedAt: new Date()
  };
}

/**
 * Applies optimistic update to signal
 * @param tasksSignal - Tasks signal
 * @param currentTasks - Current tasks array
 * @param taskIndex - Index of task to update
 * @param updatedTask - Updated task
 */
function applyOptimisticUpdate(
  tasksSignal: WritableSignal<Task[]>,
  currentTasks: Task[],
  taskIndex: number,
  updatedTask: Task
): void {
  const updatedTasks = [...currentTasks];
  updatedTasks[taskIndex] = updatedTask;
  tasksSignal.set(updatedTasks);
}

/**
 * Reverts optimistic update on error
 * @param tasksSignal - Tasks signal
 * @param taskId - Task ID
 * @param oldStatus - Original status
 */
function revertOptimisticUpdate(
  tasksSignal: WritableSignal<Task[]>,
  taskId: string,
  oldStatus: Task['status']
): void {
  const revertTasks = [...tasksSignal()];
  const currentIndex = findTaskIndex(revertTasks, taskId);
  
  if (currentIndex !== -1) {
    revertTasks[currentIndex] = {
      ...revertTasks[currentIndex],
      status: oldStatus
    };
    tasksSignal.set(revertTasks);
  }
}
