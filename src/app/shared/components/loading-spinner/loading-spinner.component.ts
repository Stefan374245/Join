import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Global and local loading spinner component
 * Displays loading overlay when any operation is in progress
 * Can work with global LoadingService or local loading signal
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      @if (inline()) {
        <div class="inline-loading-spinner" [style.width.px]="size()" [style.height.px]="size()">
          <img
            src="assets/images/loading.svg"
            alt="Loading..."
            [style.width.px]="size()"
            [style.height.px]="size()"
          />
        </div>
      } @else {
        <div class="global-loading-overlay">
          <div class="loading-spinner">
            <img src="assets/images/loading.svg" alt="Loading..." />
          </div>
        </div>
      }
    }
  `,
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  loadingService = inject(LoadingService);
  localLoading = input<boolean | undefined>(undefined);
  inline = input<boolean>(false);
  size = input<number>(64);
  
  isLoading = computed(() => {
    const local = this.localLoading();
    return local !== undefined ? local : this.loadingService.loading();
  });
}

