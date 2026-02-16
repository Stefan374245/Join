import { WritableSignal } from '@angular/core';

/**
 * Helper functions for image viewer navigation
 */

export interface NavigationState {
  currentIndex: number;
  previousIndex: number | null;
  animationDirection: 'next' | 'prev' | null;
}

/**
 * Navigate to next image with animation
 */
export function navigateToNext(
  currentIndex: number,
  totalImages: number,
  resetStateFn: () => void,
  announceImageFn: () => void
): NavigationState {
  if (totalImages === 0) return { currentIndex, previousIndex: null, animationDirection: null };

  const newState: NavigationState = {
    currentIndex: (currentIndex + 1) % totalImages,
    previousIndex: currentIndex,
    animationDirection: 'next'
  };

  resetStateFn();
  announceImageFn();

  return newState;
}

/**
 * Navigate to previous image with animation
 */
export function navigateToPrevious(
  currentIndex: number,
  totalImages: number,
  resetStateFn: () => void,
  announceImageFn: () => void
): NavigationState {
  if (totalImages === 0) return { currentIndex, previousIndex: null, animationDirection: null };

  const newState: NavigationState = {
    currentIndex: (currentIndex - 1 + totalImages) % totalImages,
    previousIndex: currentIndex,
    animationDirection: 'prev'
  };

  resetStateFn();
  announceImageFn();

  return newState;
}

/**
 * Jump to specific image by index
 */
export function jumpToSpecificImage(
  currentIndex: number,
  targetIndex: number,
  totalImages: number,
  resetStateFn: () => void,
  announceImageFn: () => void
): NavigationState | null {
  if (targetIndex < 0 || targetIndex >= totalImages) return null;
  if (targetIndex === currentIndex) return null;

  const direction = targetIndex > currentIndex ? 'next' : 'prev';

  const newState: NavigationState = {
    currentIndex: targetIndex,
    previousIndex: currentIndex,
    animationDirection: direction
  };

  resetStateFn();
  announceImageFn();

  return newState;
}

/**
 * Clear animation state after delay
 */
export function clearAnimationState(
  setAnimationDirection: (dir: 'next' | 'prev' | null) => void,
  setPreviousIndex: (index: number | null) => void,
  delay: number = 500
): void {
  setTimeout(() => {
    setAnimationDirection(null);
    setPreviousIndex(null);
  }, delay);
}
