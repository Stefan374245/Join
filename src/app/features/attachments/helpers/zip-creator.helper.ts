import JSZip from 'jszip';
import { TaskAttachment } from '../../../core/models/task.interface';
import { base64ToBlob } from './blob-downloader.helper';

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
  attachments: TaskAttachment[]
): Promise<ZipResult> {
  const zip = new JSZip();
  let successCount = 0;
  let errorCount = 0;

  for (const attachment of attachments) {
    const added = await addFileToZip(zip, attachment);
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
  attachment: TaskAttachment
): Promise<boolean> {
  try {
    const blob = base64ToBlob(attachment.base64, attachment.fileType);
    zip.file(attachment.filename, blob);
    return true;
  } catch (error) {
    console.error(`Error adding ${attachment.filename}:`, error);
    return false;
  }
}

async function generateZipBlob(zip: JSZip): Promise<Blob> {
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Logs ZIP creation summary
 * @param successCount - Number of successful files
 * @param errorCount - Number of failed files
 */
export function logZipSummary(successCount: number, errorCount: number): void {
  console.log(`ZIP created: ${successCount} successful, ${errorCount} failed`);
}
