import { TaskAttachment } from '../../../../core/models/task.interface';

/**
 * Helper functions for image transformations and URLs
 */

export interface TransformState {
  zoom: number;
  rotation: number;
  pan: { x: number; y: number };
}

/**
 * Get CSS transform string for image
 */
export function getImageTransform(state: TransformState): string {
  return `translate(${state.pan.x}px, ${state.pan.y}px) rotate(${state.rotation}deg) scale(${state.zoom})`;
}

/**
 * Get display URL for attachment
 */
export function getAttachmentImageUrl(attachment: TaskAttachment): string {
  if (attachment.downloadURL) {
    return attachment.downloadURL;
  }
  if (!attachment.base64) {
    return '';
  }
  if (attachment.base64.startsWith('data:')) {
    return attachment.base64;
  }
  return `data:${attachment.fileType};base64,${attachment.base64}`;
}

/**
 * Calculate zoom level after zoom in
 */
export function calculateZoomIn(currentZoom: number, maxZoom: number = 4): number {
  return Math.min(currentZoom + 0.25, maxZoom);
}

/**
 * Calculate zoom level after zoom out
 */
export function calculateZoomOut(currentZoom: number, minZoom: number = 0.5): number {
  return Math.max(currentZoom - 0.25, minZoom);
}

/**
 * Calculate rotation after 90 degree rotation
 */
export function calculateRotation90(currentRotation: number): number {
  return (currentRotation + 90) % 360;
}

/**
 * Create initial transform state
 */
export function createInitialTransformState(): TransformState {
  return {
    zoom: 1,
    rotation: 0,
    pan: { x: 0, y: 0 }
  };
}
