import { Task, Subtask, TaskAttachment } from '../../models/task.interface';
import { FirestoreTaskDocument, FirestoreSubtask, FirestoreAttachment } from '../../models/firestore-types.interface';
import { convertToDate } from './task-timestamp.helper';
import { TASK_STATUS } from '../../../shared/constants';

/**
 * Helper functions for mapping Firestore data to Task objects
 */

/**
 * Maps Firestore document to Task object
 * @param data - Raw Firestore data
 * @returns Mapped task object
 */
export function mapFirestoreToTask(data: FirestoreTaskDocument): Task {
  return {
    id: data['id'] || data['taskId'],
    title: data['title'] || '',
    description: data['description'] || '',
    category: data['category'] || '',
    assignedTo: extractAssignedTo(data),
    dueDate: convertToDate(data['dueDate']),
    priority: data['priority'] || 'medium',
    status: normalizeTaskStatus(data['status']),
    subtasks: mapSubtasks(data['subtasks']),
    attachments: mapAttachments(data['attachments']),
    createdAt: convertToDate(data['createdAt']),
    updatedAt: data['updatedAt'] ? convertToDate(data['updatedAt']) : undefined,
    source: data['source'] || undefined,
    creatorType: data['creatorType'] || undefined,
    creatorEmail: data['creatorEmail'] || undefined,
    creatorName: data['creatorName'] || undefined,
    aiGenerated: data['aiGenerated'] || false
  } as Task;
}

/**
 * Extracts assignedTo array from data
 * @param data - Firestore data
 * @returns Array of assigned user IDs
 */
function extractAssignedTo(data: FirestoreTaskDocument): string[] {
  return Array.isArray(data['assignedTo']) ? data['assignedTo'] : [];
}

/**
 * Normalizes task status to valid values
 * @param status - Raw status string
 * @returns Normalized status
 */
export function normalizeTaskStatus(status: string | undefined): 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' {
  if (!status) {
    return TASK_STATUS.TODO as 'todo';
  }

  const normalized = status.toLowerCase().replace(/\s+/g, '-');

  switch (normalized) {
    case 'triage':
      return TASK_STATUS.TRIAGE as 'triage';
    case 'todo':
    case 'to-do':
      return TASK_STATUS.TODO as 'todo';
    case 'in-progress':
    case 'inprogress':
      return TASK_STATUS.IN_PROGRESS as 'in-progress';
    case 'await-feedback':
    case 'awaiting-feedback':
    case 'awaitfeedback':
      return TASK_STATUS.AWAIT_FEEDBACK as 'await-feedback';
    case 'done':
    case 'completed':
      return TASK_STATUS.DONE as 'done';
    default:
      return TASK_STATUS.TODO as 'todo';
  }
}

/**
 * Maps Firestore subtask data to Subtask array
 * @param subtasks - Raw subtask data
 * @returns Array of mapped subtasks
 */
export function mapSubtasks(subtasks: FirestoreSubtask[] | undefined): Subtask[] {
  if (!subtasks || !Array.isArray(subtasks)) {
    return [];
  }

  return subtasks.map(st => mapSingleSubtask(st));
}

/**
 * Maps single subtask object
 * @param st - Raw subtask data
 * @returns Mapped subtask
 */
function mapSingleSubtask(st: FirestoreSubtask): Subtask {
  return {
    id: st.id || generateSubtaskId(),
    title: st.title || st.name || '',
    completed: st.completed === true
  };
}

/**
 * Generates unique subtask ID
 * @returns Unique ID string
 */
function generateSubtaskId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Maps Firestore attachment data to TaskAttachment array
 * @param attachments - Raw attachment data
 * @returns Array of mapped attachments
 */
export function mapAttachments(attachments: FirestoreAttachment[] | undefined): TaskAttachment[] {
  if (!attachments || !Array.isArray(attachments)) {
    return [];
  }

  return attachments.map(att => mapSingleAttachment(att));
}

/**
 * Maps single attachment object
 * @param att - Raw attachment data
 * @returns Mapped attachment
 */
function mapSingleAttachment(att: FirestoreAttachment): TaskAttachment {
  return {
    id: att.id || generateAttachmentId(),
    filename: att.filename || 'unknown',
    fileType: att.fileType || 'application/octet-stream',
    base64: att.base64, // Required: compressed base64 from Firestore
    size: att.size || 0,
    uploadedAt: convertToDate(att.uploadedAt),
    downloadURL: att.downloadURL // Optional for backward compatibility
  };
}

/**
 * Generates unique attachment ID
 * @returns Unique ID string
 */
function generateAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
