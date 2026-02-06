import JSZip from 'jszip';
import { Storage, ref, getBlob } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { TaskAttachment } from '../../../core/models/task.interface';
import { getUserAuthToken, createAuthFetchOptions } from './auth-helper';

/**
 * ZIP creation result interface
 */
export interface ZipResult {
  successCount: number;
  errorCount: number;
  zipBlob: Blob;
}

/**
 * Creates ZIP file from multiple attachments
 * @param storage - Firebase Storage instance
 * @param auth - Firebase Auth instance
 * @param attachments - Array of attachments to zip
 * @returns Promise with ZIP creation result
 */
export async function createZipFromAttachments(
  storage: Storage,
  auth: Auth,
  attachments: TaskAttachment[]
): Promise<ZipResult> {
  const zip = new JSZip();
  let successCount = 0;
  let errorCount = 0;

  for (const attachment of attachments) {
    const added = await addFileToZip(zip, storage, auth, attachment);
    if (added) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  if (successCount === 0) {
    throw new Error('No files could be added to ZIP');
  }

  const zipBlob = await generateZipBlob(zip);
  return { successCount, errorCount, zipBlob };
}

/**
 * Adds single file to ZIP archive
 * @param zip - JSZip instance
 * @param storage - Firebase Storage instance
 * @param auth - Firebase Auth instance
 * @param attachment - Attachment to add
 * @returns Promise with success boolean
 */
async function addFileToZip(
  zip: JSZip,
  storage: Storage,
  auth: Auth,
  attachment: TaskAttachment
): Promise<boolean> {
  try {
    if (!attachment.downloadURL) {
      return false;
    }

    const blob = await fetchBlobForZip(storage, auth, attachment.downloadURL);
    zip.file(attachment.filename, blob);
    return true;
  } catch (error) {
    console.error(`Error adding ${attachment.filename}:`, error);
    return false;
  }
}

/**
 * Fetches blob with fallback strategies
 * @param storage - Firebase Storage instance
 * @param auth - Firebase Auth instance
 * @param downloadURL - File download URL
 * @returns Promise with blob
 */
async function fetchBlobForZip(
  storage: Storage,
  auth: Auth,
  downloadURL: string
): Promise<Blob> {
  try {
    return await fetchViaStorage(storage, downloadURL);
  } catch (error) {
    return await fetchViaAuth(auth, downloadURL);
  }
}

/**
 * Fetches blob via Firebase Storage
 * @param storage - Firebase Storage instance
 * @param downloadURL - File download URL
 * @returns Promise with blob
 */
async function fetchViaStorage(storage: Storage, downloadURL: string): Promise<Blob> {
  const storageRef = ref(storage, downloadURL);
  return await getBlob(storageRef);
}

/**
 * Fetches blob via authenticated fetch
 * @param auth - Firebase Auth instance
 * @param downloadURL - File download URL
 * @returns Promise with blob
 */
async function fetchViaAuth(auth: Auth, downloadURL: string): Promise<Blob> {
  const token = await getUserAuthToken(auth);
  const options = createAuthFetchOptions(token);
  const response = await fetch(downloadURL, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.blob();
}

/**
 * Generates final ZIP blob
 * @param zip - JSZip instance
 * @returns Promise with ZIP blob
 */
async function generateZipBlob(zip: JSZip): Promise<Blob> {
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Logs ZIP creation summary
 * @param successCount - Number of successful files
 * @param errorCount - Number of failed files
 */
export function logZipSummary(successCount: number, errorCount: number): void {
  // Zip summary logged
}
