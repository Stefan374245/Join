import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Toast-Nachrichtentypen
 * @type {('info'|'success'|'error'|'warning')}
 */
type ToastType = 'info' | 'success' | 'error' | 'warning';

/**
 * Interface für den Toast-Status
 * @interface ToastState
 */
interface ToastState {
  /** Gibt an, ob der Toast angezeigt wird */
  show: boolean;
  /** Die anzuzeigende Nachricht */
  message: string;
  /** Der Typ der Nachricht */
  type: ToastType;
}

/**
 * Service zur Verwaltung von Toast-Benachrichtigungen
 * 
 * Dieser Service bietet Methoden zum Anzeigen verschiedener Arten von Benachrichtigungen:
 * - Info-, Success-, Error- und Warning-Toasts
 * - Spezielle Toasts für Daily Limits
 * - Task-bezogene Benachrichtigungen
 * 
 * @class ToastService
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  /** BehaviorSubject für den Toast-Status */
  private toastState = new BehaviorSubject<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });
  /** Observable Stream des Toast-Status */
  toastState$ = this.toastState.asObservable();

  /**
   * Zeigt einen Toast mit der angegebenen Nachricht und dem Typ an
   * @param {string} message - Die anzuzeigende Nachricht
   * @param {ToastType} [type='info'] - Der Typ des Toasts
   * @param {number} [duration=3000] - Anzeigedauer in Millisekunden
   * @returns {void}
   */
  showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
    this.toastState.next({ show: true, message, type });

    setTimeout(() => {
      this.hideToast();
    }, duration);
  }

  /**
   * Zeigt einen Error-Toast an
   * @param {string} message - Die Fehlermeldung
   * @param {number} [duration=3000] - Anzeigedauer in Millisekunden
   * @returns {void}
   */
  showError(message: string, duration: number = 3000): void {
    this.showToast(message, 'error', duration);
  }

  /**
   * Zeigt einen Success-Toast an
   * @param {string} message - Die Erfolgsmeldung
   * @param {number} [duration=3000] - Anzeigedauer in Millisekunden
   * @returns {void}
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.showToast(message, 'success', duration);
  }

  /**
   * Zeigt einen Warning-Toast an
   * @param {string} message - Die Warnmeldung
   * @param {number} [duration=3000] - Anzeigedauer in Millisekunden
   * @returns {void}
   */
  showWarning(message: string, duration: number = 3000): void {
    this.showToast(message, 'warning', duration);
  }

  /**
   * Zeigt einen Info-Toast an
   * @param {string} message - Die Informationsmeldung
   * @param {number} [duration=3000] - Anzeigedauer in Millisekunden
   * @returns {void}
   */
  showInfo(message: string, duration: number = 3000): void {
    this.showToast(message, 'info', duration);
  }

  /**
   * Zeigt einen Toast an, dass das Tageslimit erreicht wurde
   * @param {number} [maxLimit=10] - Das maximale Tageslimit
   * @returns {void}
   */
  showDailyLimitReached(maxLimit: number = 10): void {
    this.showError(
      `Daily limit of ${maxLimit} requests reached. Please try again tomorrow.`,
      5000
    );
  }

  /**
   * Zeigt eine Warnung über verbleibende Anfragen an
   * @param {number} remainingRequests - Anzahl verbleibender Anfragen
   * @returns {void}
   */
  showDailyLimitWarning(remainingRequests: number): void {
    this.showWarning(
      `Only ${remainingRequests} request${remainingRequests !== 1 ? 's' : ''} remaining today.`,
      4000
    );
  }

  /**
   * Zeigt eine Erfolgsmeldung für eine Anfrage an
   * @param {number} remainingRequests - Anzahl verbleibender Anfragen
   * @returns {void}
   */
  showRequestSuccess(remainingRequests: number): void {
    this.showSuccess(
      `Request sent successfully! ${remainingRequests} request${remainingRequests !== 1 ? 's' : ''} remaining today.`,
      4000
    );
  }

  /**
   * Zeigt eine Erfolgsmeldung für erstellten Task an
   * @param {string} taskTitle - Titel des Tasks
   * @returns {void}
   */
  showTaskCreated(taskTitle: string): void {
    this.showSuccess(
      `Task "${taskTitle}" created successfully!`,
      3000
    );
  }

  /**
   * Zeigt eine Erfolgsmeldung für aktualisierten Task an
   * @param {string} taskTitle - Titel des Tasks
   * @returns {void}
   */
  showTaskUpdated(taskTitle: string): void {
    this.showSuccess(
      `Task "${taskTitle}" updated successfully!`,
      3000
    );
  }

  /**
   * Zeigt eine Erfolgsmeldung für gelöschten Task an
   * @param {string} taskTitle - Titel des Tasks
   * @returns {void}
   */
  showTaskDeleted(taskTitle: string): void {
    this.showSuccess(
      `Task "${taskTitle}" deleted successfully!`,
      3000
    );
  }

  /**
   * Zeigt eine Fehlermeldung für Task-Erstellung an
   * @returns {void}
   */
  showTaskCreateError(): void {
    this.showError(
      'Failed to create task. Please try again.',
      3000
    );
  }

  /**
   * Zeigt eine Fehlermeldung für Task-Aktualisierung an
   * @returns {void}
   */
  showTaskUpdateError(): void {
    this.showError(
      'Failed to update task. Please try again.',
      3000
    );
  }

  /**
   * Zeigt eine Fehlermeldung für Task-Löschung an
   * @returns {void}
   */
  showTaskDeleteError(): void {
    this.showError(
      'Failed to delete task. Please try again.',
      3000
    );
  }

  /**
   * Versteckt den aktuell angezeigten Toast
   * @returns {void}
   */
  hideToast(): void {
    this.toastState.next({
      show: false,
      message: '',
      type: 'info'
    });
  }
}
