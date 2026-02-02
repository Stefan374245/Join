import { Firestore, doc, setDoc, updateDoc, deleteDoc, Timestamp, collection, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Injector, WritableSignal, runInInjectionContext } from '@angular/core';
import { Task, Subtask, TaskAttachment } from '../../models/task.interface';
import { FirestoreTaskDocument, FirestoreSubtask, FirestoreAttachment } from '../../models/firestore-types.interface';
import { convertToTimestamp } from './task-timestamp.helper';
import { mapFirestoreToTask } from './task-mapper.helper';
import { sortTasksByCreatedDate } from './task-filter.helper';

/**
 * Helper functions for Firestore task operations
 */

/**
 * Prepares subtasks for Firestore storage
 * @param subtasks - Array of subtasks
 * @returns Firestore-compatible subtask objects
 */
export function prepareSubtasksForFirestore(subtasks: Subtask[]): FirestoreSubtask[] {
  if (!subtasks || subtasks.length === 0) {
    return [];
  }

  return subtasks.map(st => ({
    id: st.id,
    title: st.title,
    completed: st.completed === true
  }));
}

/**
 * Prepares attachments for Firestore storage
 * @param attachments - Array of attachments
 * @returns Firestore-compatible attachment objects
 */
export function prepareAttachmentsForFirestore(attachments: TaskAttachment[]): FirestoreAttachment[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  return attachments.map(att => ({
    id: att.id,
    filename: att.filename,
    fileType: att.fileType,
    size: att.size,
    uploadedAt: att.uploadedAt ? convertToTimestamp(att.uploadedAt) : Timestamp.now(),
    downloadURL: att.downloadURL || undefined
  }));
}

/**
 * Builds task data object for Firestore
 * @param task - Task object
 * @param currentUserId - Current user ID
 * @returns Firestore task data object
 */
export function buildTaskDataForFirestore(task: Task, currentUserId: string): Partial<FirestoreTaskDocument> {
  const taskData: Partial<FirestoreTaskDocument> = {
    title: task.title,
    description: task.description,
    category: task.category,
    assignedTo: task.assignedTo || [],
    dueDate: convertToTimestamp(task.dueDate),
    priority: task.priority,
    status: task.status,
    subtasks: prepareSubtasksForFirestore(task.subtasks),
    attachments: prepareAttachmentsForFirestore(task.attachments || []),
    createdAt: task.createdAt ? convertToTimestamp(task.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: currentUserId || 'anonymous',
    source: task.source || 'member',
    creatorType: task.creatorType || 'member',
    aiGenerated: task.aiGenerated || false
  };

  if (task.creatorName) {
    taskData.creatorName = task.creatorName;
  }
  if (task.creatorEmail) {
    taskData.creatorEmail = task.creatorEmail;
  }

  return taskData;
}

/**
 * Adds task to Firestore
 * @param firestore - Firestore instance
 * @param auth - Auth instance
 * @param injector - Angular injector
 * @param task - Task to add
 */
export async function addTaskToFirestore(
  firestore: Firestore,
  auth: Auth,
  injector: Injector,
  task: Task
): Promise<void> {
  const taskDoc = doc(firestore, 'tasks', task.id);
  const currentUserId = auth.currentUser?.uid || 'anonymous';
  const taskData = buildTaskDataForFirestore(task, currentUserId);
  
  await runInInjectionContext(injector, async () => {
    await setDoc(taskDoc, taskData);
  });
}

/**
 * Updates task in Firestore
 * @param firestore - Firestore instance
 * @param injector - Angular injector
 * @param taskId - Task ID
 * @param updates - Partial task updates
 */
export async function updateTaskInFirestore(
  firestore: Firestore,
  injector: Injector,
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const taskDoc = doc(firestore, 'tasks', taskId);
  
  console.log('🔄 TaskService.updateTask() called:', {
    taskId,
    updates: {
      title: updates.title,
      category: updates.category,
      priority: updates.priority,
      assignedTo: updates.assignedTo,
      attachmentsCount: updates.attachments?.length || 0
    }
  });
  
  const updateData: Partial<FirestoreTaskDocument> = {
    updatedAt: Timestamp.now()
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.source !== undefined) updateData.source = updates.source;
  if (updates.creatorType !== undefined) updateData.creatorType = updates.creatorType;
  if (updates.aiGenerated !== undefined) updateData.aiGenerated = updates.aiGenerated;
  if (updates.creatorName !== undefined) updateData.creatorName = updates.creatorName;
  if (updates.creatorEmail !== undefined) updateData.creatorEmail = updates.creatorEmail;

  if (updates.dueDate) {
    updateData.dueDate = convertToTimestamp(updates.dueDate);
  }

  if (updates.createdAt) {
    updateData.createdAt = convertToTimestamp(updates.createdAt);
  }

  if (updates.subtasks) {
    updateData.subtasks = prepareSubtasksForFirestore(updates.subtasks);
  }

  if (updates.attachments) {
    updateData.attachments = prepareAttachmentsForFirestore(updates.attachments);
    console.log('📎 Prepared attachments for Firestore:', updateData.attachments);
  }

  console.log('💾 Sending to Firestore:', updateData);

  try {
    await runInInjectionContext(injector, async () => {
      await updateDoc(taskDoc, updateData);
    });
    console.log('✅ Firestore update successful');
  } catch (error) {
    console.error('❌ Firestore update failed:', error);
    throw error;
  }
}

/**
 * Deletes task from Firestore
 * @param firestore - Firestore instance
 * @param taskId - Task ID
 */
export async function deleteTaskFromFirestore(
  firestore: Firestore,
  taskId: string
): Promise<void> {
  const taskDoc = doc(firestore, 'tasks', taskId);
  await deleteDoc(taskDoc);
}

/**
 * Sets up real-time listener for tasks collection
 * @param firestore - Firestore instance
 * @param injector - Angular injector
 * @param tasksSignal - Writable signal for tasks
 * @param loadingSignal - Writable signal for loading state
 * @param errorSignal - Writable signal for errors
 * @returns Unsubscribe function
 */
export function setupTasksListener(
  firestore: Firestore,
  injector: Injector,
  tasksSignal: WritableSignal<Task[]>,
  loadingSignal: WritableSignal<boolean>,
  errorSignal: WritableSignal<string | null>
): () => void {
  try {
    return runInInjectionContext(injector, () => {
      const tasksCol = collection(firestore, 'tasks');
      
      return onSnapshot(tasksCol,
        (snapshot) => {
          const tasks = snapshot.docs.map((doc) => {
            const data = { id: doc.id, ...doc.data() } as unknown as FirestoreTaskDocument;
            return mapFirestoreToTask(data);
          });

          const sortedTasks = sortTasksByCreatedDate(tasks);

          tasksSignal.set(sortedTasks);
          loadingSignal.set(false);
          errorSignal.set(null);
        },
        (error) => {
          errorSignal.set('Failed to load tasks');
          loadingSignal.set(false);
          tasksSignal.set([]);
        }
      );
    });
  } catch (error) {
    errorSignal.set('Failed to initialize tasks listener');
    loadingSignal.set(false);
    tasksSignal.set([]);
    return () => {};
  }
}
