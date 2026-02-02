/**
 * Constants for task management
 */

export const TASK_STATUS = {
  TRIAGE: 'triage',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  AWAIT_FEEDBACK: 'await-feedback',
  DONE: 'done'
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  URGENT: 'urgent',
  HIGH: 'urgent' // Alias für urgent
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

export const TASK_CATEGORY = {
  TECHNICAL: 'Technical Task',
  USER_STORY: 'User Story'
} as const;

export const TASK_SOURCE = {
  MEMBER: 'member',
  EMAIL: 'email',
  WEBHOOK: 'webhook'
} as const;

export type TaskSource = typeof TASK_SOURCE[keyof typeof TASK_SOURCE];

export const TASK_LIMITS = {
  MAX_SUBTASKS: 5,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100
} as const;

/**
 * Toast messages for task operations
 */
export const TASK_MESSAGES = {
  CREATE_SUCCESS: 'Task created successfully',
  CREATE_ERROR: 'Failed to create task',
  UPDATE_SUCCESS: 'Task updated successfully',
  UPDATE_ERROR: 'Failed to update task',
  DELETE_SUCCESS: 'Task deleted successfully',
  DELETE_ERROR: 'Failed to delete task',
  MAX_SUBTASKS: 'Maximal 5 Subtasks',
  TITLE_REQUIRED: 'Title and Due Date are required',
  REQUIRED_FIELDS: 'Please fill all required fields',
  USER_NOT_AUTH: 'User not authenticated'
} as const;
