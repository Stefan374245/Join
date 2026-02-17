export interface NavigationState {
  currentIndex: number;
  previousIndex: number | null;
  animationDirection: 'next' | 'prev' | null;
}

/**
 * Navigate to next image with animation
 * @param currentIndex - Current index of the displayed image
 * @param totalImages - Total number of images available
 * @param resetStateFn - Function to reset any necessary state before navigation
 * @param announceImageFn - Function to announce the new image for accessibility
 * @return {NavigationState} - New navigation state with updated index and animation direction
 * @remarks This function calculates the next image index in a circular manner and sets the animation direction to 'next'. It also calls the provided functions to reset any necessary state and announce the new image for accessibility purposes. The returned NavigationState can be used to update the component's state accordingly.
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
 * @param currentIndex - Current index of the displayed image
 * @param totalImages - Total number of images available
 * @param resetStateFn - Function to reset any necessary state before navigation
 * @param announceImageFn - Function to announce the new image for accessibility
 * @return {NavigationState} - New navigation state with updated index and animation direction
 * @remarks This function calculates the previous image index in a circular manner and sets the animation direction to 'prev'. It also calls the provided functions to reset any necessary state and announce the new image for accessibility purposes. The returned NavigationState can be used to update the component's state accordingly.
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
 * @param currentIndex - Current index of the displayed image
 * @param targetIndex - Index of the target image to navigate to
 * @param totalImages - Total number of images available
 * @param resetStateFn - Function to reset any necessary state before navigation
 * @param announceImageFn - Function to announce the new image for accessibility
 * @return {NavigationState | null} - New navigation state with updated index and animation direction, or null if the target index is invalid or the same as the current index
 * @remarks This function calculates the direction of navigation based on the target index relative to the current index. It sets the animation direction accordingly and calls the provided functions to reset any necessary state and announce the new image for accessibility purposes. The returned NavigationState can be used to update the component's state, or null if no navigation is needed.
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
 * @param setAnimationDirection - Function to set the animation direction
 * @param setPreviousIndex - Function to set the previous index
 * @param delay - Delay in milliseconds before clearing the animation state
 * @return {void}
 * @remarks This function clears the animation state after a specified delay. It sets the animation direction and previous index to null, allowing the component to reset its state and prepare for the next navigation action.
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
