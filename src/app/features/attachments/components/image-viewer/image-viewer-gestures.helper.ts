/**
 * Helper functions for touch gesture handling
 */

export interface TouchState {
  startX: number;
  startY: number;
}

export interface PanPosition {
  x: number;
  y: number;
}

/**
 * Handle touch start event
 * @param event - Touch event
 * @param zoomLevel - Current zoom level of the image
 * @return Object with touch state and panning status, or null if not applicable
 * @remarks Determines if the touch event should initiate a pan based on the number of touches and the current zoom level. If there is one touch, it initializes the touch state for potential swipe detection. If there are two touches and the zoom level is greater than 1, it sets the state for panning. If neither condition is met, it returns null, indicating that no gesture handling is needed.
 */
export function handleTouchStart(
  event: TouchEvent,
  zoomLevel: number
): { touchState: TouchState; isPanning: boolean } | null {
  if (event.touches.length === 1) {
    return {
      touchState: {
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY
      },
      isPanning: false
    };
  } else if (event.touches.length === 2 && zoomLevel > 1) {
    return {
      touchState: { startX: 0, startY: 0 },
      isPanning: true
    };
  }
  return null;
}

/**
 * Handle touch move event for panning
 * @param event - Touch event
 * @param isPanning - Indicates if panning is active
 * @param touchStartX - Starting X position of the touch
 * @param touchStartY - Starting Y position of the touch
 * @param currentPan - Current pan position
 * @returns Object with new pan position, updated touch state, and whether to prevent default, or null if not applicable
 * @remarks Calculates the new pan position based on touch movement. If panning is active and there are two touches, it updates the pan position and touch state. This function helps in implementing smooth panning gestures for images.
 */
export function handleTouchMove(
  event: TouchEvent,
  isPanning: boolean,
  touchStartX: number,
  touchStartY: number,
  currentPan: PanPosition
): { newPan: PanPosition; newTouchState: TouchState; shouldPreventDefault: boolean } | null {
  if (!isPanning || event.touches.length !== 2) return null;

  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  return {
    newPan: {
      x: currentPan.x + deltaX,
      y: currentPan.y + deltaY
    },
    newTouchState: {
      startX: touch.clientX,
      startY: touch.clientY
    },
    shouldPreventDefault: true
  };
}

/**
 * Handle touch end event for swipe detection
 * @param event - Touch event
 * @param touchStartX - Starting X position of the touch
 * @param touchStartY - Starting Y position of the touch
 * @param swipeThreshold - Minimum distance for a swipe to be recognized
 * @returns 'next' for swipe to next, 'prev' for swipe to previous, or null if no swipe detected
 * @remarks Determines the direction of a swipe based on the change in touch position. If the horizontal movement exceeds the vertical movement and the swipe threshold, it returns the corresponding direction. Otherwise, it returns null.
 */
export function handleTouchEnd(
  event: TouchEvent,
  touchStartX: number,
  touchStartY: number,
  swipeThreshold: number = 50
): 'next' | 'prev' | null {
  if (event.changedTouches.length === 0) return null;

  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
    return deltaX > 0 ? 'prev' : 'next';
  }

  return null;
}
