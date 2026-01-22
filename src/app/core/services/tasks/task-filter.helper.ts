import { Task } from '../../models/task.interface';

/**
 * Helper functions for filtering and searching tasks
 */

/**
 * Filters tasks by search query
 * @param tasks - Array of tasks
 * @param query - Search query string
 * @returns Filtered tasks
 */
export function filterTasksByQuery(tasks: Task[], query: string): Task[] {
  const searchQuery = query.toLowerCase().trim();
  
  if (!searchQuery) {
    return tasks;
  }

  return tasks.filter(task =>
    taskMatchesQuery(task, searchQuery)
  );
}

/**
 * Checks if task matches search query
 * @param task - Task to check
 * @param query - Search query
 * @returns True if task matches
 */
function taskMatchesQuery(task: Task, query: string): boolean {
  return (
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query) ||
    task.category.toLowerCase().includes(query)
  );
}

/**
 * Groups tasks by status
 * @param tasks - Array of tasks
 * @returns Tasks grouped by status
 */
export function groupTasksByStatus(tasks: Task[]) {
  return {
    triage: tasks.filter(t => t.status === 'triage'),
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'in-progress'),
    awaitFeedback: tasks.filter(t => t.status === 'await-feedback'),
    done: tasks.filter(t => t.status === 'done')
  };
}

/**
 * Filters urgent tasks (high priority, not done)
 * @param tasks - Array of tasks
 * @returns Urgent tasks
 */
export function filterUrgentTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.priority === 'high' && t.status !== 'done');
}

/**
 * Calculates task statistics
 * @param tasks - Array of tasks
 * @param urgentTasks - Array of urgent tasks
 * @returns Task statistics object
 */
export function calculateTaskStats(tasks: Task[], urgentTasks: Task[]) {
  const byStatus = groupTasksByStatus(tasks);
  
  return {
    total: tasks.length,
    triage: byStatus.triage.length,
    todo: byStatus.todo.length,
    inProgress: byStatus.inProgress.length,
    awaitFeedback: byStatus.awaitFeedback.length,
    done: byStatus.done.length,
    urgent: urgentTasks.length
  };
}

/**
 * Finds next urgent deadline
 * @param urgentTasks - Array of urgent tasks
 * @returns Next deadline or null
 */
export function findNextUrgentDeadline(urgentTasks: Task[]): Date | null {
  if (urgentTasks.length === 0) {
    return null;
  }

  const sorted = [...urgentTasks].sort((a, b) => 
    a.dueDate.getTime() - b.dueDate.getTime()
  );

  return sorted[0].dueDate;
}

/**
 * Sorts tasks by creation date (newest first)
 * @param tasks - Array of tasks
 * @returns Sorted tasks
 */
export function sortTasksByCreatedDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return dateB - dateA;
  });
}
