import { Task, TaskAttachment, Subtask } from '../../models/task.interface';
import { TaskFormData, TaskFormContext, FormSubtask } from '../../models/firestore-types.interface';

export async function uploadAndPrepareAttachments(
  attachments: TaskAttachment[] | undefined
): Promise<TaskAttachment[]> {
  return attachments || [];
}

export async function processAttachmentsForUpdate(
  attachments: TaskAttachment[] | undefined
): Promise<TaskAttachment[]> {
  return attachments || [];
}

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

function mapSubtasksFromForm(subtasks: FormSubtask[]): Subtask[] {
  return subtasks.map(st => ({
    id: st.id,
    title: st.title,
    completed: st.completed ?? false
  }));
}

export function generateTaskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
