import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Global loading spinner component
 * Displays loading overlay when any operation is in progress
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.loading()) {
      <div class="global-loading-overlay">
        <div class="loading-spinner">
          <img src="assets/images/loading.svg" alt="Loading..." />
        </div>
      </div>
    }
  `,
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  /** Inject global loading service */
  loadingService = inject(LoadingService);
}

