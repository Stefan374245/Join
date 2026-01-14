import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="showToast()" [@toastAnimation]>
      <div class="toast-message">{{ message() }}</div>
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
export class ToastComponent {
  /** Computed Signals für direkte Anbindung an Service */
  showToast = computed(() => this.toastService.toast().show);
  message = computed(() => this.toastService.toast().message);
  type = computed(() => this.toastService.toast().type);

  constructor(private toastService: ToastService) {}
}
