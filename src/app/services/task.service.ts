import { Injectable, inject } from '@angular/core';
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
import { Auth } from '@angular/fire/auth';
import { Observable, from, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Task, Subtask } from '../models/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.initializeTasksListener();
  }

  /**
   * Initialize real-time listener for tasks
   */
  private initializeTasksListener(): void {
    try {
      const tasksCol = collection(this.firestore, 'tasks');
      const tasksQuery = query(tasksCol, orderBy('createdAt', 'desc'));
      
      // Use onSnapshot for real-time updates
      onSnapshot(tasksQuery, 
        (snapshot) => {
          console.log('🔍 Raw snapshot from Firestore:', snapshot.docs.length, 'documents');
          
          const tasks = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log('📄 Document data:', { id: doc.id, ...data });
            return this.mapFirestoreTask({ id: doc.id, ...data });
          });
          
          console.log('📋 Tasks loaded from Firestore:', tasks.length);
          console.log('✅ Mapped tasks:', tasks);
          this.tasksSubject.next(tasks);
        },
        (error) => {
          console.error('❌ Error in onSnapshot:', error);
          console.error('Error details:', error.message, error.code);
          this.tasksSubject.next([]);
        }
      );
    } catch (error) {
      console.error('❌ Critical error initializing tasks listener:', error);
      this.tasksSubject.next([]);
    }
  }

  /**
   * Map Firestore data to Task interface
   */
  private mapFirestoreTask(data: any): Task {
    // Map old status values to new ones if needed
    let status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' = 'todo';
    if (data.status) {
      // Handle old status values
      switch (data.status.toLowerCase()) {
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
          console.warn(`Unknown status: ${data.status}, defaulting to 'todo'`);
          status = 'todo';
      }
    }

    return {
      id: data.id || data.taskId,
      title: data.title || '',
      description: data.description || '',
      category: data.category || '',
      assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [],
      dueDate: this.convertToDate(data.dueDate),
      priority: data.priority || 'medium',
      status: status,
      subtasks: this.mapSubtasks(data.subtasks)
    } as Task;
  }

  /**
   * Map Firestore subtasks data
   */
  private mapSubtasks(subtasks: any): Subtask[] {
    if (!subtasks || !Array.isArray(subtasks)) {
      return [];
    }
    
    return subtasks.map((st: any) => ({
      id: st.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: st.title || st.name || '',
      completed: st.completed === true // Explicit boolean check
    }));
  }

  /**
   * Convert Firestore Timestamp to Date
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
   * Convert Date to Firestore Timestamp
   */
  private convertToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Get all tasks
   */
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Get task by ID
   */
  getTaskById(taskId: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === taskId))
    );
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: 'todo' | 'in-progress' | 'done'): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === status))
    );
  }

  /**
   * Get urgent tasks (priority = high)
   */
  getUrgentTasks(): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.priority === 'high'))
    );
  }

  /**
   * Get task statistics
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
   * Get next urgent deadline
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
   * Add a new task
   */
  addTask(task: Task): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', task.id);
    
    // Prepare task data with proper Firestore types
    const taskData = {
      title: task.title,
      description: task.description,
      category: task.category,
      assignedTo: task.assignedTo || [],
      dueDate: this.convertToTimestamp(task.dueDate),
      priority: task.priority,
      status: task.status,
      subtasks: this.prepareSubtasks(task.subtasks),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.auth.currentUser?.uid || 'anonymous'
    };

    console.log('💾 Saving task to Firestore:', taskData);

    const promise = setDoc(taskDoc, taskData).then(() => {
      console.log('✅ Task saved successfully');
    });

    return from(promise);
  }

  /**
   * Prepare subtasks for Firestore
   */
  private prepareSubtasks(subtasks: Subtask[]): any[] {
    if (!subtasks || subtasks.length === 0) {
      return [];
    }
    
    return subtasks.map(st => ({
      id: st.id,
      title: st.title,
      completed: st.completed === true // Explicit boolean
    }));
  }

  /**
   * Update an existing task
   */
  updateTask(taskId: string, updates: Partial<Task>): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    
    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert dueDate if present
    if (updates.dueDate) {
      updateData.dueDate = this.convertToTimestamp(updates.dueDate);
    }

    // Prepare subtasks if present
    if (updates.subtasks) {
      updateData.subtasks = this.prepareSubtasks(updates.subtasks);
    }

    const promise = updateDoc(taskDoc, updateData).then(() => {
      console.log('✅ Task updated successfully');
    });

    return from(promise);
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    const promise = deleteDoc(taskDoc).then(() => {
      console.log('🗑️ Task deleted successfully');
    });

    return from(promise);
  }

  /**
   * Update task status (for drag and drop on board)
   */
  updateTaskStatus(taskId: string, status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): Observable<void> {
    return this.updateTask(taskId, { status });
  }

  /**
   * Update subtask completion state
   * @param taskId - The task ID
   * @param subtaskId - The subtask ID
   * @param completed - The new completed state (true or false)
   */
  updateSubtaskCompletion(taskId: string, subtaskId: string, completed: boolean): Observable<void> {
    console.log('🔧 Service: updateSubtaskCompletion called for:', subtaskId, 'new state:', completed);
    
    // Get current task from the BehaviorSubject
    const tasks = this.tasksSubject.value;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || !task.subtasks) {
      console.error('❌ Service: Task or subtasks not found');
      return new Observable(observer => {
        observer.error(new Error('Task or subtasks not found'));
        observer.complete();
      });
    }

    // Find the subtask
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      console.error('❌ Service: Subtask not found:', subtaskId);
      return new Observable(observer => {
        observer.error(new Error('Subtask not found'));
        observer.complete();
      });
    }

    console.log('🔧 Service: Setting state to:', completed);

    // Create updated subtasks array with new state
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: completed } : st
    );
    
    // Update in Firestore
    return this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  /**
   * Toggle subtask completion (DEPRECATED - use updateSubtaskCompletion instead)
   */
  toggleSubtask(taskId: string, subtaskId: string): Observable<void> {
    console.log('⚠️ Service: toggleSubtask is deprecated, use updateSubtaskCompletion instead');
    
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

    // Use the new method
    return this.updateSubtaskCompletion(taskId, subtaskId, !subtask.completed);
  }

  /**
   * Add subtask to existing task
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
   * Remove subtask from task
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


