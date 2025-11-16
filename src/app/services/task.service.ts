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

  private initializeTasksListener(): void {
    try {
      const tasksCol = collection(this.firestore, 'tasks');
      // Remove orderBy to get all tasks

      onSnapshot(tasksCol,
        (snapshot) => {
          const tasks = snapshot.docs.map((doc) => {
            const data = doc.data();
            return this.mapFirestoreTask({ id: doc.id, ...data });
          });

          // Sort in memory instead
          tasks.sort((a, b) => {
            const dateA = (a as any).createdAt instanceof Date ? (a as any).createdAt.getTime() : 0;
            const dateB = (b as any).createdAt instanceof Date ? (b as any).createdAt.getTime() : 0;
            return dateB - dateA;
          });

          this.tasksSubject.next(tasks);
        },
        (error) => {
          this.tasksSubject.next([]);
        }
      );
    } catch (error) {
      this.tasksSubject.next([]);}
  }

  private mapFirestoreTask(data: any): Task {
    let status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' = 'todo';

    // Ändere data.status zu data['status']
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
      createdAt: this.convertToDate(data['createdAt'])
    } as Task;
  }

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

  private convertToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(taskId: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === taskId))
    );
  }

  getTasksByStatus(status: 'todo' | 'in-progress' | 'done'): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === status))
    );
  }

  getUrgentTasks(): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.priority === 'high'))
    );
  }

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

  addTask(task: Task): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', task.id);

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

    const promise = setDoc(taskDoc, taskData).then(() => {
    });

    return from(promise);
  }

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

  deleteTask(taskId: string): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    const promise = deleteDoc(taskDoc).then(() => {
    });

    return from(promise);
  }

  updateTaskStatus(taskId: string, status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): Observable<void> {
    return this.updateTask(taskId, { status });
  }

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


