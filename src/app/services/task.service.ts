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

/**
 * Service zur Verwaltung von Aufgaben (Tasks)
 * 
 * Dieser Service verwaltet alle aufgabenbezogenen Operationen:
 * - Echtzeit-Synchronisation mit Firestore
 * - CRUD-Operationen für Tasks
 * - Verwaltung von Subtasks
 * - Status-Übergänge und Filterung
 * - Statistiken und Analysen
 * 
 * @class TaskService
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  /** BehaviorSubject für die aktuelle Task-Liste */
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  /** Observable Stream aller Tasks */
  public tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.initializeTasksListener();
  }

  /**
   * Initialisiert den Firestore-Listener für Echtzeit-Updates
   * @private
   * @returns {void}
   */
  private initializeTasksListener(): void {
    try {
      const tasksCol = collection(this.firestore, 'tasks');

      onSnapshot(tasksCol,
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

          this.tasksSubject.next(tasks);
        },
        (error) => {
          this.tasksSubject.next([]);
        }
      );
    } catch (error) {
      this.tasksSubject.next([]);}
  }

  /**
   * Mappt Firestore-Daten zu einem Task-Objekt
   * Behandelt verschiedene Status-Formate und konvertiert Datumsfelder
   * @private
   * @param {any} data - Rohdaten aus Firestore
   * @returns {Task} Gemapptes Task-Objekt
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
   * Mappt Subtask-Daten aus Firestore
   * @private
   * @param {any} subtasks - Rohdaten der Subtasks
   * @returns {Subtask[]} Array von gemappten Subtasks
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
   * Konvertiert verschiedene Timestamp-Formate zu einem Date-Objekt
   * @private
   * @param {any} timestamp - Timestamp in verschiedenen Formaten
   * @returns {Date} JavaScript Date-Objekt
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
   * Konvertiert ein Date-Objekt zu einem Firestore Timestamp
   * @private
   * @param {Date} date - JavaScript Date-Objekt
   * @returns {Timestamp} Firestore Timestamp
   */
  private convertToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Gibt ein Observable aller Tasks zurück
   * @returns {Observable<Task[]>} Observable Stream aller Tasks
   */
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Sucht einen Task anhand der ID
   * @param {string} taskId - Die Task-ID
   * @returns {Observable<Task | undefined>} Observable mit dem Task oder undefined
   */
  getTaskById(taskId: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === taskId))
    );
  }

  /**
   * Filtert Tasks nach Status
   * @param {('todo'|'in-progress'|'done')} status - Der gewünschte Status
   * @returns {Observable<Task[]>} Observable mit gefilterten Tasks
   */
  getTasksByStatus(status: 'todo' | 'in-progress' | 'done'): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === status))
    );
  }

  /**
   * Gibt alle Tasks mit hoher Priorität zurück
   * @returns {Observable<Task[]>} Observable mit dringenden Tasks
   */
  getUrgentTasks(): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.priority === 'high'))
    );
  }

  /**
   * Gibt Statistiken über Tasks zurück
   * @returns {Observable<Object>} Observable mit Task-Statistiken (total, todo, inProgress, done, urgent)
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
   * Gibt den nächsten dringenden Termin zurück
   * @returns {Observable<Date | null>} Observable mit dem nächsten Deadline oder null
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
   * Fügt einen neuen Task zu Firestore hinzu
   * @param {Task} task - Der hinzuzufügende Task
   * @returns {Observable<void>} Observable des Hinzufügevorgangs
   */
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
      createdAt: task.createdAt ? this.convertToTimestamp(task.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: this.auth.currentUser?.uid || 'anonymous',
      source: task.source || 'member',
      creatorType: task.creatorType || 'member',
      creatorName: task.creatorName || undefined,
      creatorEmail: task.creatorEmail || undefined,
      aiGenerated: task.aiGenerated || false
    };

    const promise = setDoc(taskDoc, taskData).then(() => {
    });

    return from(promise);
  }

  /**
   * Bereitet Subtasks für Firestore vor
   * @private
   * @param {Subtask[]} subtasks - Array von Subtasks
   * @returns {any[]} Array von Firestore-kompatiblen Subtask-Objekten
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
   * Aktualisiert einen bestehenden Task
   * @param {string} taskId - Die Task-ID
   * @param {Partial<Task>} updates - Die zu aktualisierenden Felder
   * @returns {Observable<void>} Observable des Aktualisierungsvorgangs
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
   * Löscht einen Task aus Firestore
   * @param {string} taskId - Die ID des zu löschenden Tasks
   * @returns {Observable<void>} Observable des Löschvorgangs
   */
  deleteTask(taskId: string): Observable<void> {
    const taskDoc = doc(this.firestore, 'tasks', taskId);
    const promise = deleteDoc(taskDoc).then(() => {
    });

    return from(promise);
  }

  /**
   * Aktualisiert den Status eines Tasks
   * @param {string} taskId - Die Task-ID
   * @param {('triage'|'todo'|'in-progress'|'await-feedback'|'done')} status - Der neue Status
   * @returns {Observable<void>} Observable des Status-Updates
   */
  updateTaskStatus(taskId: string, status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'): Observable<void> {
    return this.updateTask(taskId, { status });
  }

  /**
   * Aktualisiert den Erledigungs-Status eines Subtasks
   * @param {string} taskId - Die Task-ID
   * @param {string} subtaskId - Die Subtask-ID
   * @param {boolean} completed - Erledigungs-Status
   * @returns {Observable<void>} Observable des Updates
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
   * Schaltet den Erledigungs-Status eines Subtasks um
   * @param {string} taskId - Die Task-ID
   * @param {string} subtaskId - Die Subtask-ID
   * @returns {Observable<void>} Observable des Toggle-Vorgangs
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
   * Fügt einen neuen Subtask zu einem Task hinzu
   * @param {string} taskId - Die Task-ID
   * @param {Subtask} subtask - Der hinzuzufügende Subtask
   * @returns {Observable<void>} Observable des Hinzufügevorgangs
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
   * Entfernt einen Subtask von einem Task
   * @param {string} taskId - Die Task-ID
   * @param {string} subtaskId - Die ID des zu entfernenden Subtasks
   * @returns {Observable<void>} Observable des Entfernungsvorgangs
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


