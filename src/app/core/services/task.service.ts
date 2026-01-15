import { Injectable, inject, signal, computed, effect } from '@angular/core';
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
import { Observable, from, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Task, Subtask } from '../models/task.interface';

/**
 * Signal-based task management service with real-time Firestore synchronization
 */

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  /** Signal für die aktuelle Task-Liste */
  private tasksSignal = signal<Task[]>([]);
  
  /** Signal für Loading-State */
  private loadingSignal = signal<boolean>(false);
  
  /** Signal für Error-State */
  private errorSignal = signal<string | null>(null);
  
  /** Public readonly Signals */
  public readonly tasks = this.tasksSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  /** Computed Signals für Filterung & Statistiken */
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
  
  /** Observable für Backwards Compatibility */
  public readonly tasks$ = toObservable(this.tasks);
  
  /** Legacy BehaviorSubject für alte Code-Teile */
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  
  /** Referenz zum Snapshot-Listener */
  private unsubscribe: (() => void) | null = null;

  constructor() {
    // Effect für Auth-State-Änderungen
    const authStateSignal = toSignal(authState(this.auth), { initialValue: null });
    
    effect(() => {
      const user = authStateSignal();
      if (user) {
        this.initializeTasksListener();
      } else {
        // Wenn kein User eingeloggt ist, leere die Tasks und stoppe den Listener
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
        this.tasksSignal.set([]);
        this.tasksSubject.next([]);
      }
    });
  }

  /**
   * Initializes real-time Firestore listener for task updates
   */
  private initializeTasksListener(): void {
    // Wenn bereits ein Listener aktiv ist, stoppe ihn
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.loadingSignal.set(true);

    try {
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

          // Signal & BehaviorSubject aktualisieren (für Backwards Compatibility)
          this.tasksSignal.set(tasks);
          this.tasksSubject.next(tasks);
          this.loadingSignal.set(false);
          this.errorSignal.set(null);
        },
        (error) => {
          this.errorSignal.set('Failed to load tasks');
          this.loadingSignal.set(false);
          this.tasksSignal.set([]);
          this.tasksSubject.next([]);
        }
      );
    } catch (error) {
      this.errorSignal.set('Failed to initialize tasks listener');
      this.loadingSignal.set(false);
      this.tasksSignal.set([]);
      this.tasksSubject.next([]);
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
   * Returns Observable of all tasks
   * @returns Observable stream of all tasks
   * @deprecated Use tasks signal instead
   */
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Finds task by ID using signals
   * @param taskId - The task ID
   * @returns Task or undefined
   */
  findTaskById(taskId: string): Task | undefined {
    return this.tasks().find(task => task.id === taskId);
  }

  /**
   * Finds task by ID using Observable
   * @param taskId - The task ID
   * @returns Observable with task or undefined
   * @deprecated Use findTaskById() or tasks signal instead
   */
  getTaskById(taskId: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === taskId))
    );
  }

  /**
   * Filters tasks by status using Observable
   * @param status - The desired status
   * @returns Observable with filtered tasks
   * @deprecated Use tasksByStatus signal instead
   */
  getTasksByStatus(status: 'todo' | 'in-progress' | 'done'): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === status))
    );
  }

  /**
   * Returns high priority tasks using Observable
   * @returns Observable with urgent tasks
   * @deprecated Use urgentTasks signal instead
   */
  getUrgentTasks(): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.priority === 'high'))
    );
  }

  /**
   * Returns task statistics using Observable
   * @returns Observable with task statistics
   * @deprecated Use taskStats signal instead
   */
  getTaskStats(): Observable<{
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    urgent: number;
  }> {
    return this.tasks$.pipe(
      map(tasks => ({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        urgent: tasks.filter(t => t.priority === 'high').length
      }))
    );
  }

  /**
   * Returns next urgent deadline using Observable
   * @returns Observable with next deadline or null
   * @deprecated Use nextUrgentDeadline signal instead
   */
  getNextUrgentDeadline(): Observable<Date | null> {
    return this.tasks$.pipe(
      map(tasks => {
        const urgentTasks = tasks
          .filter(t => t.priority === 'high' && t.status !== 'done')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        return urgentTasks.length > 0 ? urgentTasks[0].dueDate : null;
      })
    );
  }

  /**
   * Adds new task to Firestore
   * @param task - The task to add
   * @returns Observable of the add operation
   */
  addTask(task: Task): Observable<void> {
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
      createdAt: task.createdAt ? this.convertToTimestamp(task.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.auth.currentUser?.uid || 'anonymous',
      source: task.source || 'member',
      creatorType: task.creatorType || 'member',
      aiGenerated: task.aiGenerated || false
    };

    // Only add optional fields if they have values
    if (task.creatorName) {
      taskData.creatorName = task.creatorName;
    }
    if (task.creatorEmail) {
      taskData.creatorEmail = task.creatorEmail;
    }

    const promise = setDoc(taskDoc, taskData).then(() => {
    });

    return from(promise);
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
   * Updates existing task in Firestore
   * @param taskId - The task ID
   * @param updates - The fields to update
   * @returns Observable of the update operation
   */
  updateTask(taskId: string, updates: Partial<Task>): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);

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

    const promise = updateDoc(taskDoc, updateData).then(() => {
    });

    return from(promise);
  }

  /**
   * Deletes task from Firestore
   * @param taskId - The ID of the task to delete
   * @returns Observable of the delete operation
   */
  deleteTask(taskId: string): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    const promise = deleteDoc(taskDoc).then(() => {
    });

    return from(promise);
  }

  /**
   * Updates task status
   * @param taskId - The task ID
   * @param status - The new status
   * @returns Observable of the status update
   */
  updateTaskStatus(taskId: string, status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): Observable<void> {
    return this.updateTask(taskId, { status });
  }

  /**
   * Updates subtask completion status
   * @param taskId - The task ID
   * @param subtaskId - The subtask ID
   * @param completed - Completion status
   * @returns Observable of the update
   */
  updateSubtaskCompletion(taskId: string, subtaskId: string, completed: boolean): Observable<void> {
    const tasks = this.tasksSubject.value;
    const task = tasks.find(t => t.id === taskId);

    if (!task || !task.subtasks) {
      return new Observable(observer => {
        observer.error(new Error('Task or subtasks not found'));
        observer.complete();
      });
    }

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      return new Observable(observer => {
        observer.error(new Error('Subtask not found'));
        observer.complete();
      });
    }

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: completed } : st
    );

    return this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  /**
   * Toggles subtask completion status
   * @param taskId - The task ID
   * @param subtaskId - The subtask ID
   * @returns Observable of the toggle operation
   */
  toggleSubtask(taskId: string, subtaskId: string): Observable<void> {
    const tasks = this.tasksSubject.value;
    const task = tasks.find(t => t.id === taskId);

    if (!task || !task.subtasks) {
      return new Observable(observer => {
        observer.error(new Error('Task or subtasks not found'));
        observer.complete();
      });
    }

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      return new Observable(observer => {
        observer.error(new Error('Subtask not found'));
        observer.complete();
      });
    }

    return this.updateSubtaskCompletion(taskId, subtaskId, !subtask.completed);
  }

  /**
   * Adds new subtask to existing task
   * @param taskId - The task ID
   * @param subtask - The subtask to add
   * @returns Observable of the add operation
   */
  addSubtaskToTask(taskId: string, subtask: Subtask): Observable<void> {
    return new Observable(observer => {
      this.getTaskById(taskId).subscribe(task => {
        if (task) {
          const updatedSubtasks = [...task.subtasks, subtask];

          this.updateTask(taskId, { subtasks: updatedSubtasks }).subscribe({
            next: () => observer.next(),
            error: (err) => observer.error(err),
            complete: () => observer.complete()
          });
        } else {
          observer.error(new Error('Task not found'));
        }
      });
    });
  }

  /**
   * Removes subtask from task
   * @param taskId - The task ID
   * @param subtaskId - The ID of the subtask to remove
   * @returns Observable of the remove operation
   */
  removeSubtaskFromTask(taskId: string, subtaskId: string): Observable<void> {
    return new Observable(observer => {
      this.getTaskById(taskId).subscribe(task => {
        if (task) {
          const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);

          this.updateTask(taskId, { subtasks: updatedSubtasks }).subscribe({
            next: () => observer.next(),
            error: (err) => observer.error(err),
            complete: () => observer.complete()
          });
        } else {
          observer.error(new Error('Task not found'));
        }
      });
    });
  }
}


