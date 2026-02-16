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
