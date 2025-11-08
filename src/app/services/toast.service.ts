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

  hideToast(): void {
    this.toastState.next({
      show: false,
      message: '',
      type: 'info'
    });
  }
}
