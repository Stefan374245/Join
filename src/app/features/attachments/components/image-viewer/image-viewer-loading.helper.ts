import { WritableSignal } from '@angular/core';

/**
 * Helper functions for image loading state management
 */

/**
 * Check if image is loading
 */
export function isImageLoading(
  loadingStates: Map<number, boolean>,
  index: number
): boolean {
  return loadingStates.get(index) ?? true;
}

/**
 * Update image loading state
 */
export function updateImageLoadingState(
  currentStates: Map<number, boolean>,
  index: number,
  isLoading: boolean
): Map<number, boolean> {
  const states = new Map(currentStates);
  states.set(index, isLoading);
  return states;
}

/**
 * Check if thumbnail is loading
 */
export function isThumbnailLoading(
  loadingStates: Map<string, boolean>,
  attachmentId: string
): boolean {
  return loadingStates.get(attachmentId) ?? true;
}

/**
 * Update thumbnail loading state
 */
export function updateThumbnailLoadingState(
  currentStates: Map<string, boolean>,
  attachmentId: string,
  isLoading: boolean
): Map<string, boolean> {
  const states = new Map(currentStates);
  states.set(attachmentId, isLoading);
  return states;
}

/**
 * Preload image for smooth transitions
 */
export function preloadImage(url: string): void {
  const img = new Image();
  img.src = url;
}
