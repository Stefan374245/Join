import { Injectable, signal, computed } from '@angular/core';

/**
 * Global loading service using Signal-based pattern
 * Manages loading state across the application with support for multiple concurrent operations
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  /**
   * Counter for tracking multiple simultaneous loading operations
   * @private
   */
  private loadingCountSignal = signal<number>(0);

  /**
   * Public readonly computed signal indicating if any loading operation is active
   * Returns true if loadingCount > 0
   */
  public readonly loading = computed(() => this.loadingCountSignal() > 0);

  /**
   * Increment loading counter to show loading state
   * Safe to call multiple times for concurrent operations
   */
  show(): void {
    this.loadingCountSignal.update(count => count + 1);
  }

  /**
   * Decrement loading counter to hide loading state
   * Automatically prevents negative values
   */
  hide(): void {
    this.loadingCountSignal.update(count => Math.max(0, count - 1));
  }

  /**
   * Force reset loading state to hidden
   * Use only in error scenarios where loading state might be stuck
   */
  reset(): void {
    this.loadingCountSignal.set(0);
  }
}
