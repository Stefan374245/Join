import { Task, TaskAttachment, Subtask } from '../../models/task.interface';
import { TaskFormData, TaskFormContext, FormSubtask } from '../../models/firestore-types.interface';

/**
 * Helper functions for task form operations
 */

/**
 * Uploads attachments and adds URLs
 * @param attachments - Attachments to upload
 * @param taskId - Task ID
 * @param uploadFn - Upload function from service
 * @returns Attachments with download URLs
 */
export async function uploadAndPrepareAttachments(
  attachments: TaskAttachment[] | undefined,
  taskId: string,
  uploadFn: (attachments: TaskAttachment[], taskId: string) => Promise<string[]>
): Promise<TaskAttachment[]> {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const downloadURLs = await uploadFn(attachments, taskId);

  return attachments.map((att, index) => ({
    ...att,
    downloadURL: downloadURLs[index]
  }));
}

/**
 * Processes attachments for update (upload new, keep existing)
 * @param attachments - All attachments
 * @param taskId - Task ID
 * @param uploadFn - Upload function
 * @returns Final attachments with URLs
 */
export async function processAttachmentsForUpdate(
  attachments: TaskAttachment[] | undefined,
  taskId: string,
  uploadFn: (attachments: TaskAttachment[], taskId: string) => Promise<string[]>
): Promise<TaskAttachment[]> {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const { oldAttachments, newAttachments } = separateAttachments(attachments);

  if (newAttachments.length === 0) {
    return oldAttachments;
  }

  const uploadedAttachments = await uploadAndPrepareAttachments(
    newAttachments,
    taskId,
    uploadFn
  );

  return [...oldAttachments, ...uploadedAttachments];
}

/**
 * Separates old and new attachments
 * @param attachments - All attachments
 * @returns Old and new attachments
 */
function separateAttachments(attachments: TaskAttachment[]): {
  oldAttachments: TaskAttachment[];
  newAttachments: TaskAttachment[];
} {
  return {
    oldAttachments: attachments.filter(att => att.downloadURL),
    newAttachments: attachments.filter(att => !att.downloadURL)
  };
}

/**
 * Builds task object from form data
 * @param formData - Form data
 * @param additionalData - Additional context
 * @param taskId - Task ID
 * @param attachments - Prepared attachments
 * @returns Complete task object
 */
export function buildTaskFromFormData(
  formData: TaskFormData,
  additionalData: {
    selectedCategory: string;
    selectedContactIds: string[];
    selectedPriority: string;
    initialStatus: string;
    subtasks: FormSubtask[];
  },
  taskId: string,
  attachments: TaskAttachment[]
): Task {
  return {
    id: taskId,
    title: formData.title,
    description: formData.description,
    category: additionalData.selectedCategory,
    assignedTo: additionalData.selectedContactIds,
    dueDate: new Date(formData.dueDate),
    priority: additionalData.selectedPriority as 'low' | 'medium' | 'high',
    status: additionalData.initialStatus as Task['status'],
    subtasks: mapSubtasksFromForm(additionalData.subtasks),
    attachments: attachments,
    createdAt: new Date()
  };
}

/**
 * Builds update object from form data
 * @param formData - Form data
 * @param additionalData - Additional context
 * @param attachments - Prepared attachments
 * @returns Partial task updates
 */
export function buildTaskUpdatesFromFormData(
  formData: TaskFormData,
  additionalData: {
    selectedCategory: string;
    selectedContactIds: string[];
    selectedPriority: string;
    subtasks: FormSubtask[];
  },
  attachments: TaskAttachment[]
): Partial<Task> {
  return {
    title: formData.title,
    description: formData.description,
    category: additionalData.selectedCategory,
    assignedTo: additionalData.selectedContactIds,
    dueDate: new Date(formData.dueDate),
    priority: additionalData.selectedPriority as 'low' | 'medium' | 'high',
    subtasks: mapSubtasksFromForm(additionalData.subtasks),
    attachments: attachments
  };
}

/**
 * Maps subtasks from form data
 * @param subtasks - Form subtasks
 * @returns Mapped subtasks
 */
function mapSubtasksFromForm(subtasks: FormSubtask[]): Subtask[] {
  return subtasks.map(st => ({
    id: st.id,
    title: st.title,
    completed: st.completed ?? false
  }));
}

/**
 * Generates unique task ID
 * @returns Unique ID string
 */
export function generateTaskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
