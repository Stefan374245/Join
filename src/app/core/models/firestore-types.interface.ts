import { Timestamp } from '@angular/fire/firestore';

/**
 * Firestore document interfaces for tasks
 * These represent the raw data structures stored in Firestore
 */

/**
 * Union type for flexible timestamp input (forms, API, parsing)
 */
export type FirestoreTimestampInput = 
  | Timestamp 
  | Date 
  | string 
  | number 
  | { seconds: number; nanoseconds?: number }
  | null 
  | undefined;

/**
 * Firestore task document structure (from Firebase SDK doc.data())
 */
export interface FirestoreTaskDocument {
  id?: string;
  taskId?: string;
  title: string;
  description: string;
  category: string;
  assignedTo: string[];
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  status: string;
  subtasks: FirestoreSubtask[];
  attachments: FirestoreAttachment[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  source?: 'email' | 'member';
  creatorType?: 'member' | 'external';
  creatorEmail?: string;
  creatorName?: string;
  aiGenerated?: boolean;
}

/**
 * Firestore subtask structure
 */
export interface FirestoreSubtask {
  id: string;
  title?: string;
  name?: string;
  completed: boolean;
}

/**
 * Firestore attachment structure
 */
export interface FirestoreAttachment {
  id: string;
  filename: string;
  fileType: string;
  type?: string;
  base64?: string;
  size: number;
  uploadedAt: Timestamp;
  downloadURL?: string;
  url?: string;
}

/**
 * Form data interfaces for task creation/update
 */

/**
 * Task form data from Angular FormGroup
 */
export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string | Date;
}

/**
 * Additional context data for task forms
 */
export interface TaskFormContext {
  userId?: string;
  selectedCategory: string;
  selectedContactIds: string[];
  selectedPriority: string;
  initialStatus?: string;
  subtasks: FormSubtask[];
  attachments?: FormAttachment[];
}

/**
 * Subtask from form data
 */
export interface FormSubtask {
  id: string;
  title: string;
  completed?: boolean;
}

/**
 * Attachment from form (before upload)
 */
export interface FormAttachment {
  id: string;
  filename: string;
  fileType: string;
  base64: string;
  size: number;
  uploadedAt: Date;
  downloadURL?: string;
}
