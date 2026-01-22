import { Injectable, inject, signal, computed, effect, Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Firestore } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Task, Subtask, TaskAttachment } from '../models/task.interface';
import { AttachmentStorageService } from './attachment-storage.service';
import { mapFirestoreToTask } from './tasks/task-mapper.helper';
import { filterTasksByQuery, groupTasksByStatus, filterUrgentTasks, calculateTaskStats, findNextUrgentDeadline} from './tasks/task-filter.helper';
import { addTaskToFirestore, updateTaskInFirestore, deleteTaskFromFirestore, setupTasksListener } from './tasks/task-firestore.helper';
import { performOptimisticStatusUpdate } from './tasks/task-optimistic-update.helper';
import { uploadAndPrepareAttachments, processAttachmentsForUpdate, buildTaskFromFormData, buildTaskUpdatesFromFormData, generateTaskId } from './tasks/task-form.helper';
import { updateSubtaskInTask, addSubtaskToTaskList, removeSubtaskFromTaskList } from './tasks/task-subtask.helper';

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
  
  public readonly filteredTasks = computed(() => 
    filterTasksByQuery(this.tasks(), this.searchQuerySignal())
  );
  
  public readonly tasksByStatus = computed(() => 
    groupTasksByStatus(this.tasks())
  );
  
  public readonly filteredTasksByStatus = computed(() => 
    groupTasksByStatus(this.filteredTasks())
  );
  
  public readonly urgentTasks = computed(() => 
    filterUrgentTasks(this.tasks())
  );
  
  public readonly taskStats = computed(() => 
    calculateTaskStats(this.tasks(), this.urgentTasks())
  );
  
  public readonly nextUrgentDeadline = computed(() => 
    findNextUrgentDeadline(this.urgentTasks())
  );
  
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

    this.unsubscribe = setupTasksListener(
      this.firestore,
      this.injector,
      this.tasksSignal,
      this.loadingSignal,
      this.errorSignal
    );
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
    const { revertFn } = performOptimisticStatusUpdate(
      this.tasksSignal,
      taskId,
      newStatus
    );

    try {
      await this.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      revertFn();
      throw error;
    }
  }

  /**
   * Adds new task to Firestore
   * @param task - The task to add
   * @returns Promise of the add operation
   */
  async addTask(task: Task): Promise<void> {
    await addTaskToFirestore(
      this.firestore,
      this.auth,
      this.injector,
      task
    );
  }

  /**
   * Updates existing task in Firestore
   * @param taskId - The task ID
   * @param updates - The fields to update
   * @returns Promise of the update operation
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    await updateTaskInFirestore(
      this.firestore,
      this.injector,
      taskId,
      updates
    );
  }

  /**
   * Deletes task from Firestore
   * @param taskId - The ID of the task to delete
   * @returns Promise of the delete operation
   */
  async deleteTask(taskId: string): Promise<void> {
    await deleteTaskFromFirestore(this.firestore, taskId);
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
    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedSubtasks = updateSubtaskInTask(task, subtaskId, completed);
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

    const updatedSubtasks = addSubtaskToTaskList(task, subtask);
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

    const updatedSubtasks = removeSubtaskFromTaskList(task, subtaskId);
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
      userId: string;
      selectedCategory: string;
      selectedContactIds: string[];
      selectedPriority: string;
      initialStatus: string;
      subtasks: any[];
      attachments?: TaskAttachment[];
    }
  ): Promise<Task> {
    const taskId = generateTaskId();

    const attachmentsWithURLs = await uploadAndPrepareAttachments(
      additionalData.attachments,
      taskId,
      this.attachmentStorage.uploadAttachments.bind(this.attachmentStorage)
    );

    const newTask = buildTaskFromFormData(
      formData,
      additionalData,
      taskId,
      attachmentsWithURLs
    );

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
      selectedCategory: string;
      selectedContactIds: string[];
      selectedPriority: string;
      subtasks: any[];
      attachments?: TaskAttachment[];
    }
  ): Promise<Task> {
    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const finalAttachments = await processAttachmentsForUpdate(
      additionalData.attachments,
      taskId,
      this.attachmentStorage.uploadAttachments.bind(this.attachmentStorage)
    );

    const updates = buildTaskUpdatesFromFormData(
      formData,
      additionalData,
      finalAttachments
    );

    await this.updateTask(taskId, updates);
    return { ...task, ...updates };
  }

}


