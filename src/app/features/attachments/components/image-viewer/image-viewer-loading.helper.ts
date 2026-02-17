/**
 * Image viewer loading state helper functions
 * @return {boolean} - Whether the image is currently loading
 * @remarks These helper functions manage the loading state of images in the image viewer component. They use Maps to track the loading status of each image and thumbnail based on their index or attachment ID. The functions provide a way to check if an image is still loading and to update the loading state when necessary. Additionally, there is a function to preload images for smoother transitions when navigating between them.
 */
export function isImageLoading(
  loadingStates: Map<number, boolean>,
  index: number
): boolean {
  return loadingStates.get(index) ?? true;
}

/**
 * Update image loading state
 * @param currentStates - Current loading states map
 * @param index - Index of the image
 * @param isLoading - New loading state
 * @return {Map<number, boolean>} - Updated loading states map
 * @remarks This function creates a new Map based on the current loading states and updates the loading state for the specified image index. It returns the updated Map, which can then be used to update the component's state. This approach ensures immutability and allows for efficient state management in Angular components.
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
 * @param loadingStates - Map of thumbnail loading states
 * @param attachmentId - ID of the attachment
 * @return {boolean} - Whether the thumbnail is currently loading
 * @remarks This function checks the loading state of a thumbnail based on its attachment ID. It returns true if the thumbnail is still loading (i.e., if the state is not set or is true) and false if it has finished loading. This allows the component to display loading indicators for thumbnails that are still being fetched or processed.
 */
export function isThumbnailLoading(
  loadingStates: Map<string, boolean>,
  attachmentId: string
): boolean {
  return loadingStates.get(attachmentId) ?? true;
}

/**
 * Update thumbnail loading state
 * @param currentStates - Current loading states map
 * @param attachmentId - ID of the attachment
 * @param isLoading - New loading state
 * @return {Map<string, boolean>} - Updated loading states map
 * @remarks Similar to the image loading state update function, this function creates a new Map based on the current thumbnail loading states and updates the loading state for the specified attachment ID. It returns the updated Map for use in state management within the component.
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
 * @param url - URL of the image to preload
 * @return {void}
 * @remarks This function creates a new Image object and sets its source to the provided URL. This triggers the browser to start loading the image in the background, which can help ensure that the image is ready to be displayed when the user navigates to it in the image viewer. Preloading images can improve the user experience by reducing perceived loading times and providing smoother transitions between images.
 */
export function preloadImage(url: string): void {
  const img = new Image();
  img.src = url;
}
