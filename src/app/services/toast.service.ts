import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface ToastState {
  show: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastState = new BehaviorSubject<ToastState>({ show: false, message: '' });
  toastState$ = this.toastState.asObservable();

  showToast(message: string, duration: number = 3000): void {
    this.toastState.next({ show: true, message });
    
    setTimeout(() => {
      this.toastState.next({ show: false, message: '' });
    }, duration);
  }

  hideToast(): void {
    this.toastState.next({ show: false, message: '' });
  }
}