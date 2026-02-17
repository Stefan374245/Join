import { Storage, ref, getBlob } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { getUserAuthToken, createAuthFetchOptions } from './auth-helper';

export interface DownloadResult {
  blob: Blob;
  success: boolean;
}

/**
 * Attempts to download file via Firebase Storage getBlob
 * @param storage - Firebase Storage instance
 * @param downloadURL - File download URL
 * @returns Promise with blob or null if failed
 */
export async function tryDownloadViaStorageBlob(
  storage: Storage,
  downloadURL: string
): Promise<Blob | null> {
  try {
    const storageRef = ref(storage, downloadURL);
    const blob = await getBlob(storageRef);
    return blob;
  } catch (error) {
    return null;
  }
}

/**
 * Attempts to download file via fetch with authentication
 * @param auth - Firebase Auth instance
 * @param downloadURL - File download URL
 * @returns Promise with blob or null if failed
 */
export async function tryDownloadViaFetch(
  auth: Auth,
  downloadURL: string
): Promise<Blob | null> {
  try {
    const token = await getUserAuthToken(auth);
    const options = createAuthFetchOptions(token);
    const response = await fetch(downloadURL, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    return null;
  }
}

/**
 * Downloads file by opening in new tab (fallback)
 * @param downloadURL - File download URL
 * @param filename - Target filename
 */
export function downloadViaNewTab(downloadURL: string, filename: string): void {
  const link = createNewTabLink(downloadURL, filename);
  triggerNewTabDownload(link);
  removeLink(link);
}

/**
 * Creates anchor element for new tab download
 * @param url - Download URL
 * @param filename - Target filename
 * @returns Configured anchor element
 */
function createNewTabLink(url: string, filename: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = filename;
  return link;
}

/**
 * Triggers new tab download
 * @param link - Anchor element
 * @remarks Opens the download URL in a new browser tab. This is a fallback strategy for downloading files when other methods fail, but it relies on the browser's handling of the download URL and may not work in all cases (e.g., if the URL requires authentication or if pop-ups are blocked).
 */
function triggerNewTabDownload(link: HTMLAnchorElement): void {
  document.body.appendChild(link);
  link.click();
}

/**
 * Removes link from DOM
 * @param link - Anchor element to remove
 *  @remarks Cleans up the DOM by removing the anchor element after triggering the download. This helps prevent cluttering the DOM with unused elements and ensures that the download process is as seamless as possible for the user.
 */
function removeLink(link: HTMLAnchorElement): void {
  document.body.removeChild(link);
}

/**
 * Downloads attachment using multiple fallback strategies
 * @param storage - Firebase Storage instance
 * @param auth - Firebase Auth instance
 * @param downloadURL - File download URL
 * @param filename - Target filename
 * @returns Promise with blob or null
 */
export async function downloadWithFallback(
  storage: Storage,
  auth: Auth,
  downloadURL: string,
  filename: string
): Promise<Blob | null> {
  const blobViaStorage = await tryDownloadViaStorageBlob(storage, downloadURL);
  if (blobViaStorage) {
    return blobViaStorage;
  }

  const blobViaFetch = await tryDownloadViaFetch(auth, downloadURL);
  if (blobViaFetch) {
    return blobViaFetch;
  }

  downloadViaNewTab(downloadURL, filename);
  return null;
}
