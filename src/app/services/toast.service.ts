import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastState = new BehaviorSubject<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });
  toastState$ = this.toastState.asObservable();

  showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
    this.toastState.next({ show: true, message, type });

    setTimeout(() => {
      this.hideToast();
    }, duration);
  }

  showError(message: string, duration: number = 3000): void {
    this.showToast(message, 'error', duration);
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.showToast(message, 'success', duration);
  }

  showWarning(message: string, duration: number = 3000): void {
    this.showToast(message, 'warning', duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.showToast(message, 'info', duration);
  }

  /**
   * Show daily limit specific toast messages
   */
  showDailyLimitReached(maxLimit: number = 10): void {
    this.showError(
      `Daily limit of ${maxLimit} requests reached. Please try again tomorrow.`,
      5000
    );
  }

  showDailyLimitWarning(remainingRequests: number): void {
    this.showWarning(
      `Only ${remainingRequests} request${remainingRequests !== 1 ? 's' : ''} remaining today.`,
      4000
    );
  }

  showRequestSuccess(remainingRequests: number): void {
    this.showSuccess(
      `Request sent successfully! ${remainingRequests} request${remainingRequests !== 1 ? 's' : ''} remaining today.`,
      4000
    );
  }

  hideToast(): void {
    this.toastState.next({
      show: false,
      message: '',
      type: 'info'
    });
  }
}
