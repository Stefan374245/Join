import { Component, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { animate, style, transition, trigger } from "@angular/animations";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="showToast()" [@toastAnimation]>
      <div class="toast-message">{{ message() }}</div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        left: 50%;
        top: 100%;
        transform: translate(-50%, -150%);
        z-index: 1000;
        max-width: 90vw;
        width: auto;
        padding: 0 16px;
      }
      .toast-message {
        color: white;
        font-size: 16px;
        font-weight: bold;
        background-color: #2a3647;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        white-space: normal;
        word-wrap: break-word;
        max-width: 100%;
        line-height: 1.4;
      }

      @media (max-width: 768px) {
        .toast-container {
          max-width: 92vw;
        }
        .toast-message {
          padding: 18px;
          border-radius: 8px;
        }
      }

      @media (max-width: 480px) {
        .toast-container {
          max-width: 95vw;
          padding: 0 12px;
        }
        .toast-message {
          padding: 16px;
        }
      }
    `,
  ],
  animations: [
    trigger("toastAnimation", [
      transition(":enter", [
        style({ opacity: 0, transform: "translate(-50%, -120%)" }),
        animate(
          "300ms ease-out",
          style({ opacity: 1, transform: "translate(-50%, -150%)" }),
        ),
      ]),
      transition(":leave", [
        animate(
          "300ms ease-in",
          style({ opacity: 0, transform: "translate(-50%, -120%)" }),
        ),
      ]),
    ]),
  ],
})
export class ToastComponent {
  showToast = computed(() => this.toastService.toast().show);
  message = computed(() => this.toastService.toast().message);
  type = computed(() => this.toastService.toast().type);

  constructor(private toastService: ToastService) {}
}
