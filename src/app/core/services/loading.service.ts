import { Injectable, signal, computed } from '@angular/core';

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
   * Map for tracking image loading states by unique identifier
   * @private
   */
  private imageLoadingStates = signal<Map<string, boolean>>(new Map());

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

  /**
   * Mark an image as loading
   * @param id - Unique identifier for the image (e.g., attachment.id or index)
   */
  setImageLoading(id: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(id, true);
    this.imageLoadingStates.set(states);
  }

  /**
   * Mark an image as loaded
   * @param id - Unique identifier for the image
   */
  setImageLoaded(id: string): void {
    const states = new Map(this.imageLoadingStates());
    states.set(id, false);
    this.imageLoadingStates.set(states);
  }

  /**
   * Check if an image is currently loading
   * @param id - Unique identifier for the image
   * @returns true if image is loading, defaults to true for new images
   */
  isImageLoading(id: string): boolean {
    return this.imageLoadingStates().get(id) ?? true;
  }

  /**
   * Clear image loading state for a specific image
   * @param id - Unique identifier for the image
   */
  clearImageState(id: string): void {
    const states = new Map(this.imageLoadingStates());
    states.delete(id);
    this.imageLoadingStates.set(states);
  }

  /**
   * Clear all image loading states
   * Useful when closing a component or resetting state
   */
  clearAllImageStates(): void {
    this.imageLoadingStates.set(new Map());
  }

  /**
   * Get event handlers for image loading
   * Returns an object with onLoadStart and onLoad handlers
   * @param id - Unique identifier for the image
   */
  getImageLoadHandlers(id: string) {
    return {
      onLoadStart: () => this.setImageLoading(id),
      onLoad: () => this.setImageLoaded(id)
    };
  }
}
