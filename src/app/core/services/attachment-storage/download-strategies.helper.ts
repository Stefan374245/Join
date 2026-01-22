import { Storage, ref, getBlob } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { getUserAuthToken, createAuthFetchOptions } from './auth-helper';

/**
 * Download strategy result interface
 */
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
    console.warn('Storage getBlob failed:', error);
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
    console.warn('Fetch download failed:', error);
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
 */
function triggerNewTabDownload(link: HTMLAnchorElement): void {
  document.body.appendChild(link);
  link.click();
}

/**
 * Removes link from DOM
 * @param link - Anchor element to remove
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
  // Strategy 1: Firebase Storage getBlob
  const blobViaStorage = await tryDownloadViaStorageBlob(storage, downloadURL);
  if (blobViaStorage) {
    return blobViaStorage;
  }

  // Strategy 2: Fetch with authentication
  const blobViaFetch = await tryDownloadViaFetch(auth, downloadURL);
  if (blobViaFetch) {
    return blobViaFetch;
  }

  // Strategy 3: Open in new tab (no blob returned)
  console.warn('All download strategies failed, opening in new tab');
  downloadViaNewTab(downloadURL, filename);
  return null;
}
