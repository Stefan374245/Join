/**
 * Helper functions for blob download operations
 */

/**
 * Downloads blob as file to user's device
 * @param blob - Blob data to download
 * @param filename - Target filename for download
 */
export function downloadBlobToFile(blob: Blob, filename: string): void {
  const url = createBlobUrl(blob);
  triggerDownload(url, filename);
  revokeBlobUrl(url);
}

/**
 * Creates object URL from blob
 * @param blob - Blob data
 * @returns Object URL string
 */
function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Triggers browser download
 * @param url - Object URL to download
 * @param filename - Target filename
 */
function triggerDownload(url: string, filename: string): void {
  const anchor = createDownloadAnchor(url, filename);
  executeDownload(anchor);
  removeAnchor(anchor);
}

/**
 * Creates anchor element for download
 * @param url - Download URL
 * @param filename - Target filename
 * @returns Configured anchor element
 */
function createDownloadAnchor(url: string, filename: string): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  return anchor;
}

/**
 * Executes download via anchor click
 * @param anchor - Anchor element
 */
function executeDownload(anchor: HTMLAnchorElement): void {
  document.body.appendChild(anchor);
  anchor.click();
}

/**
 * Removes anchor from DOM
 * @param anchor - Anchor element to remove
 */
function removeAnchor(anchor: HTMLAnchorElement): void {
  document.body.removeChild(anchor);
}

/**
 * Revokes object URL to free memory
 * @param url - Object URL to revoke
 */
function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}
