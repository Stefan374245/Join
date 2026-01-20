import { Injectable, inject, signal, computed, effect, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
  getDocs,
  onSnapshot
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Task, Subtask, TaskAttachment } from '../models/task.interface';
import { AttachmentStorageService } from './attachment-storage.service';

/**
 * Signal-based task management service with real-time Firestore synchronization
 */

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private attachmentStorage = inject(AttachmentStorageService);
  private injector = inject(Injector);
  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private searchQuerySignal = signal<string>('');
  
  public readonly tasks = this.tasksSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  public readonly searchQuery = this.searchQuerySignal.asReadonly();
  
  public readonly filteredTasks = computed(() => {
    const allTasks = this.tasks();
    const query = this.searchQuerySignal().toLowerCase().trim();
    
    if (!query) return allTasks;
    
    return allTasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.category.toLowerCase().includes(query)
    );
  });
  
  public readonly tasksByStatus = computed(() => {
    const allTasks = this.tasks();
    return {
      triage: allTasks.filter(t => t.status === 'triage'),
      todo: allTasks.filter(t => t.status === 'todo'),
      inProgress: allTasks.filter(t => t.status === 'in-progress'),
      awaitFeedback: allTasks.filter(t => t.status === 'await-feedback'),
      done: allTasks.filter(t => t.status === 'done')
    };
  });
  
  public readonly filteredTasksByStatus = computed(() => {
    const filtered = this.filteredTasks();
    return {
      triage: filtered.filter(t => t.status === 'triage'),
      todo: filtered.filter(t => t.status === 'todo'),
      inProgress: filtered.filter(t => t.status === 'in-progress'),
      awaitFeedback: filtered.filter(t => t.status === 'await-feedback'),
      done: filtered.filter(t => t.status === 'done')
    };
  });
  
  public readonly urgentTasks = computed(() => 
    this.tasks().filter(t => t.priority === 'high' && t.status !== 'done')
  );
  
  public readonly taskStats = computed(() => ({
    total: this.tasks().length,
    triage: this.tasksByStatus().triage.length,
    todo: this.tasksByStatus().todo.length,
    inProgress: this.tasksByStatus().inProgress.length,
    awaitFeedback: this.tasksByStatus().awaitFeedback.length,
    done: this.tasksByStatus().done.length,
    urgent: this.urgentTasks().length
  }));
  
  public readonly nextUrgentDeadline = computed(() => {
    const urgent = this.urgentTasks()
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return urgent.length > 0 ? urgent[0].dueDate : null;
  });
  
  public readonly tasks$ = toObservable(this.tasks);
  private unsubscribe: (() => void) | null = null;

  constructor() {
    const authStateSignal = toSignal(authState(this.auth), { initialValue: null });
    
    effect(() => {
      const user = authStateSignal();
      if (user) {
        this.initializeTasksListener();
      } else {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
        this.tasksSignal.set([]);
      }
    });
  }

  /**
   * Initializes real-time Firestore listener for task updates
   */
  private initializeTasksListener(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.loadingSignal.set(true);

    try {
      runInInjectionContext(this.injector, () => {
        const tasksCol = collection(this.firestore, 'tasks');
        
        this.unsubscribe = onSnapshot(tasksCol,
          (snapshot) => {
            const tasks = snapshot.docs.map((doc) => {
              const data = doc.data();
              return this.mapFirestoreTask({ id: doc.id, ...data });
            });

            tasks.sort((a, b) => {
              const dateA = (a as any).createdAt instanceof Date ? (a as any).createdAt.getTime() : 0;
              const dateB = (b as any).createdAt instanceof Date ? (b as any).createdAt.getTime() : 0;
              return dateB - dateA;
            });

            this.tasksSignal.set(tasks);
            this.loadingSignal.set(false);
            this.errorSignal.set(null);
          },
          (error) => {
            this.errorSignal.set('Failed to load tasks');
            this.loadingSignal.set(false);
            this.tasksSignal.set([]);
          }
        );
      });
    } catch (error) {
      this.errorSignal.set('Failed to initialize tasks listener');
      this.loadingSignal.set(false);
      this.tasksSignal.set([]);
    }
  }

  /**
   * Maps Firestore data to Task object with status normalization
   * @param data - Raw Firestore data
   * @returns Mapped task object
   */
  private mapFirestoreTask(data: any): Task {
    let status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' = 'todo';

    if (data['status']) {
      switch (data['status'].toLowerCase()) {
        case 'triage':
          status = 'triage';
          break;
        case 'todo':
        case 'to-do':
          status = 'todo';
          break;
        case 'in-progress':
        case 'inprogress':
        case 'in progress':
          status = 'in-progress';
          break;
        case 'await-feedback':
        case 'awaiting-feedback':
        case 'awaiting feedback':
        case 'awaitfeedback':
          status = 'await-feedback';
          break;
        case 'done':
        case 'completed':
          status = 'done';
          break;
        default:
          status = 'todo';
      }
    }

    return {
      id: data['id'] || data['taskId'],
      title: data['title'] || '',
      description: data['description'] || '',
      category: data['category'] || '',
      assignedTo: Array.isArray(data['assignedTo']) ? data['assignedTo'] : [],
      dueDate: this.convertToDate(data['dueDate']),
      priority: data['priority'] || 'medium',
      status: status,
      subtasks: this.mapSubtasks(data['subtasks']),
      attachments: this.mapAttachments(data['attachments']),
      createdAt: this.convertToDate(data['createdAt']),
      updatedAt: data['updatedAt'] ? this.convertToDate(data['updatedAt']) : undefined,
      source: data['source'] || undefined,
      creatorType: data['creatorType'] || undefined,
      creatorEmail: data['creatorEmail'] || undefined,
      creatorName: data['creatorName'] || undefined,
      aiGenerated: data['aiGenerated'] || false
    } as Task;
  }

  /**
   * Maps Firestore subtask data to Subtask array
   * @param subtasks - Raw subtask data
   * @returns Array of mapped subtasks
   */
  private mapSubtasks(subtasks: any): Subtask[] {
    if (!subtasks || !Array.isArray(subtasks)) {
      return [];
    }

    return subtasks.map((st: any) => ({
      id: st.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: st.title || st.name || '',
      completed: st.completed === true
    }));
  }

  /**
   * Maps Firestore attachment data to TaskAttachment array
   * @param attachments - Raw attachment data
   * @returns Array of mapped attachments
   */
  private mapAttachments(attachments: any): TaskAttachment[] {
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments.map((att: any) => ({
      id: att.id || '',
      filename: att.filename || '',
      fileType: att.fileType || 'image/jpeg',
      base64: att.downloadURL || '',  // Use downloadURL as base64 fallback for display
      size: att.size || 0,
      uploadedAt: this.convertToDate(att.uploadedAt),
      downloadURL: att.downloadURL || undefined
    }));
  }

  /**
   * Converts various timestamp formats to Date object
   * @param timestamp - Timestamp in various formats
   * @returns JavaScript Date object
   */
  private convertToDate(timestamp: any): Date {
    if (!timestamp) {
      return new Date();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }

    return new Date(timestamp);
  }

  /**
   * Converts Date object to Firestore Timestamp
   * @param date - JavaScript Date object
   * @returns Firestore Timestamp
   */
  private convertToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }


  /**
   * Gets a single task by ID using signals
   * @param id - The task ID to search for
   * @returns The task if found, undefined otherwise
   */
  findTaskById(id: string): Task | undefined {
    return this.tasksSignal().find(task => task.id === id);
  }



  /**
   * Sets the search query for filtering tasks
   * @param query - The search query string
   */
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  /**
   * Clears the current search query
   */
  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  /**
   * Updates task status with optimistic UI updates
   * @param taskId - The task ID
   * @param newStatus - The new status
   * @returns Promise of the update operation
   */
  async updateTaskStatusOptimistic(taskId: string, newStatus: Task['status']): Promise<void> {
    const currentTasks = this.tasksSignal();
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const oldStatus = currentTasks[taskIndex].status;
    
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = { 
      ...updatedTasks[taskIndex], 
      status: newStatus,
      updatedAt: new Date()
    };
    this.tasksSignal.set(updatedTasks);

    try {
      await this.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      const revertTasks = [...this.tasksSignal()];
      const currentIndex = revertTasks.findIndex(t => t.id === taskId);
      if (currentIndex !== -1) {
        revertTasks[currentIndex] = { 
          ...revertTasks[currentIndex], 
          status: oldStatus 
        };
        this.tasksSignal.set(revertTasks);
      }
      throw error;
    }
  }

  /**
   * Adds new task to Firestore
   * @param task - The task to add
   * @returns Promise of the add operation
   */
  async addTask(task: Task): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', task.id);

    const taskData: any = {
      title: task.title,
      description: task.description,
      category: task.category,
      assignedTo: task.assignedTo || [],
      dueDate: this.convertToTimestamp(task.dueDate),
      priority: task.priority,
      status: task.status,
      subtasks: this.prepareSubtasks(task.subtasks),
      attachments: this.prepareAttachments(task.attachments || []),
      createdAt: task.createdAt ? this.convertToTimestamp(task.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.auth.currentUser?.uid || 'anonymous',
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

    await runInInjectionContext(this.injector, async () => {
      await setDoc(taskDoc, taskData);
    });
  }

  /**
   * Prepares subtasks for Firestore storage
   * @param subtasks - Array of subtasks
   * @returns Array of Firestore-compatible subtask objects
   */
  private prepareSubtasks(subtasks: Subtask[]): any[] {
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
   * @returns Array of Firestore-compatible attachment objects
   */
  private prepareAttachments(attachments: TaskAttachment[]): any[] {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    return attachments.map(att => ({
      id: att.id,
      filename: att.filename,
      fileType: att.fileType,
      size: att.size,
      uploadedAt: this.convertToTimestamp(att.uploadedAt),
      downloadURL: att.downloadURL || null
    }));
  }

  /**
   * Updates existing task in Firestore
   * @param taskId - The task ID
   * @param updates - The fields to update
   * @returns Promise of the update operation
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);

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

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.dueDate) {
      updateData.dueDate = this.convertToTimestamp(updates.dueDate);
    }

    if (updates.subtasks) {
      updateData.subtasks = this.prepareSubtasks(updates.subtasks);
    }

    if (updates.attachments) {
      updateData.attachments = this.prepareAttachments(updates.attachments);
      console.log('📎 Prepared attachments for Firestore:', updateData.attachments);
    }

    console.log('💾 Sending to Firestore:', updateData);

    try {
      await runInInjectionContext(this.injector, async () => {
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
   * @param taskId - The ID of the task to delete
   * @returns Promise of the delete operation
   */
  async deleteTask(taskId: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    await deleteDoc(taskDoc);
  }

  /**
   * Updates task status
   * @param taskId - The task ID
   * @param status - The new status
   * @returns Promise of the status update
   */
  async updateTaskStatus(taskId: string, status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): Promise<void> {
    await this.updateTask(taskId, { status });
  }

  /**
   * Updates subtask completion status using signals
   * @param taskId - The task ID
   * @param subtaskId - The subtask ID
   * @param completed - Completion status
   * @returns Promise of the update
   */
  async updateSubtaskCompletion(taskId: string, subtaskId: string, completed: boolean): Promise<void> {
    const tasks = this.tasksSignal();
    const task = tasks.find(t => t.id === taskId);

    if (!task || !task.subtasks) {
      throw new Error('Task or subtasks not found');
    }

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: completed } : st
    );

    await this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  /**
   * Toggles subtask completion status using signals
   * @param taskId - The task ID
   * @param subtaskId - The subtask ID
   * @returns Promise of the toggle operation
   */
  async toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
    const tasks = this.tasksSignal();
    const task = tasks.find(t => t.id === taskId);

    if (!task || !task.subtasks) {
      throw new Error('Task or subtasks not found');
    }

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }

    await this.updateSubtaskCompletion(taskId, subtaskId, !subtask.completed);
  }

  /**
   * Adds new subtask to existing task using signals
   * @param taskId - The task ID
   * @param subtask - The subtask to add
   * @returns Promise of the add operation
   */
  async addSubtaskToTask(taskId: string, subtask: Subtask): Promise<void> {
    const task = this.findTaskById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedSubtasks = [...task.subtasks, subtask];
    await this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  /**
   * Removes subtask from existing task using signals
   * @param taskId - The task ID
   * @param subtaskId - The ID of the subtask to remove
   * @returns Promise of the remove operation
   */
  async removeSubtaskFromTask(taskId: string, subtaskId: string): Promise<void> {
    const task = this.findTaskById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    await this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  /**
   * Removes attachment from task
   * @param taskId - The task ID
   * @param attachmentId - The attachment ID to remove
   * @returns Promise of the update operation
   */
  async removeAttachment(taskId: string, attachmentId: string): Promise<void> {
    const task = this.findTaskById(taskId);

    if (!task || !task.attachments) {
      throw new Error('Task or attachments not found');
    }

    const updatedAttachments = task.attachments.filter(att => att.id !== attachmentId);
    await this.updateTask(taskId, { attachments: updatedAttachments });
  }

  /**
   * Creates a new task with form data and user context
   * @param formData - Form values from task creation form
   * @param additionalData - Additional context data (userId, status, etc.)
   * @returns Promise of the created task
   */
  async createTaskFromForm(
    formData: any, 
    additionalData: {
      userId: string,
      selectedCategory: string,
      selectedContactIds: string[],
      selectedPriority: string,
      initialStatus: string,
      subtasks: any[],
      attachments?: TaskAttachment[]
    }
  ): Promise<Task> {
    const taskId = this.generateTaskId();
    
    console.log('📝 Creating task with attachments:', {
      taskId,
      hasAttachments: !!additionalData.attachments,
      attachmentCount: additionalData.attachments?.length || 0
    });
    
    // Upload attachments to Firebase Storage if present
    let attachmentsWithURLs: TaskAttachment[] = [];
    if (additionalData.attachments && additionalData.attachments.length > 0) {
      console.log('⬆️  Uploading attachments...');
      const downloadURLs = await this.attachmentStorage.uploadAttachments(
        additionalData.attachments,
        taskId
      );
      
      console.log('✅ Upload complete, URLs:', downloadURLs);
      
      attachmentsWithURLs = additionalData.attachments.map((att, index) => ({
        ...att,
        downloadURL: downloadURLs[index]
      }));
    }
    
    const newTask: Task = {
      id: taskId,
      title: formData.title,
      description: formData.description,
      category: additionalData.selectedCategory,
      assignedTo: additionalData.selectedContactIds,
      dueDate: new Date(formData.dueDate),
      priority: additionalData.selectedPriority as 'low' | 'medium' | 'high',
      status: additionalData.initialStatus as 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done',
      subtasks: additionalData.subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed ?? false
      })),
      attachments: attachmentsWithURLs,
      createdAt: new Date()
    };

    await this.addTask(newTask);
    return newTask;
  }

  /**
   * Updates an existing task with form data
   * @param taskId - ID of the task to update
   * @param formData - Form values from task edit form
   * @param additionalData - Additional context data
   * @returns Promise of the updated task
   */
  async updateTaskFromForm(
    taskId: string,
    formData: any,
    additionalData: {
      selectedCategory: string,
      selectedContactIds: string[],
      selectedPriority: string,
      subtasks: any[],
      attachments?: TaskAttachment[]
    }
  ): Promise<Task> {
    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    console.log('📝 Updating task with attachments:', {
      taskId,
      hasAttachments: !!additionalData.attachments,
      attachmentCount: additionalData.attachments?.length || 0
    });

    // Separate old attachments (with downloadURL) and new attachments (without downloadURL)
    let finalAttachments: TaskAttachment[] = [];
    
    if (additionalData.attachments && additionalData.attachments.length > 0) {
      const oldAttachments = additionalData.attachments.filter(att => att.downloadURL);
      const newAttachments = additionalData.attachments.filter(att => !att.downloadURL);
      
      console.log('📂 Attachments breakdown:', {
        total: additionalData.attachments.length,
        existing: oldAttachments.length,
        new: newAttachments.length
      });
      
      // Upload only new attachments
      if (newAttachments.length > 0) {
        console.log('⬆️  Uploading new attachments...');
        const downloadURLs = await this.attachmentStorage.uploadAttachments(
          newAttachments,
          taskId
        );
        
        console.log('✅ Upload complete, URLs:', downloadURLs);
        
        const newAttachmentsWithURLs = newAttachments.map((att, index) => ({
          ...att,
          downloadURL: downloadURLs[index]
        }));
        
        finalAttachments = [...oldAttachments, ...newAttachmentsWithURLs];
      } else {
        finalAttachments = oldAttachments;
      }
    }

    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      category: additionalData.selectedCategory,
      assignedTo: additionalData.selectedContactIds,
      dueDate: new Date(formData.dueDate),
      priority: additionalData.selectedPriority as 'low' | 'medium' | 'high',
      subtasks: additionalData.subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed ?? false
      })),
      attachments: finalAttachments
    };

    await this.updateTask(taskId, updates);
    const updatedTask: Task = { ...task, ...updates };
    return updatedTask;
  }

  /**
   * Generates unique ID for new tasks
   * @returns Unique string ID
   */
  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}


