import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="showToast" [@toastAnimation]>
      <div class="toast-message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      left: 50%;
      top: 100%;
      transform: translate(-50%, -150%);
      z-index: 1000;
    }
    .toast-message {
      color: white;
      font-size: 16px;
      font-weight: bold;
      background-color: #2A3647;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      white-space: nowrap;
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, -120%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translate(-50%, -150%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translate(-50%, -120%)' }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  showToast = false;
  message = '';
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toastState$.subscribe(
      ({ show, message }) => {
        this.message = message;
        this.showToast = show;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
