import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { TaskAttachment } from '../../../core/models/task.interface';
import { LoadingService } from '../../../core/services/loading.service';
import { formatBase64DataUrl } from '../helpers/base64-formatter.helper';
import { downloadBlobToFile } from '../helpers/blob-downloader.helper';
import { downloadWithFallback } from '../helpers/download-strategies.helper';
import { createZipFromAttachments, logZipSummary } from '../helpers/zip-creator.helper';

/**
 * Service for managing attachment storage operations with Firebase Storage
 * Handles upload, download, and deletion of task attachments
 */
@Injectable({
  providedIn: 'root'
})
export class AttachmentStorageService {
  private storage = inject(Storage);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private loadingService = inject(LoadingService);

  /**
   * Uploads attachment to Firebase Storage
   * @param attachment - Attachment with base64 data
   * @param taskId - Task ID for folder structure
   * @returns Promise with download URL
   */
  async uploadAttachment(attachment: TaskAttachment, taskId: string): Promise<string> {
    return await runInInjectionContext(this.injector, async () => {
      const filePath = this.buildFilePath(taskId, attachment);
      const storageRef = ref(this.storage, filePath);
      const formattedData = formatBase64DataUrl(attachment.base64, attachment.fileType);
      
      await uploadString(storageRef, formattedData, 'data_url');
      return await getDownloadURL(storageRef);
    });
  }

  /**
   * Builds storage file path for attachment
   * @param taskId - Task ID
   * @param attachment - Attachment data
   * @returns File path string
   */
  private buildFilePath(taskId: string, attachment: TaskAttachment): string {
    return `tasks/${taskId}/attachments/${attachment.id}_${attachment.filename}`;
  }

  /**
   * Uploads multiple attachments in parallel
   * @param attachments - Array of attachments
   * @param taskId - Task ID for folder structure
   * @returns Promise with array of download URLs
   */
  async uploadAttachments(attachments: TaskAttachment[], taskId: string): Promise<string[]> {
    const uploadPromises = attachments.map(att => this.uploadAttachment(att, taskId));
    return Promise.all(uploadPromises);
  }

  /**
   * Deletes attachment from Firebase Storage
   * @param downloadURL - Download URL of the file
   */
  async deleteAttachment(downloadURL: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const storageRef = ref(this.storage, downloadURL);
      await deleteObject(storageRef);
    });
  }

  /**
   * Deletes multiple attachments in parallel
   * @param downloadURLs - Array of download URLs
   */
  async deleteAttachments(downloadURLs: string[]): Promise<void> {
    const deletePromises = downloadURLs.map(url => this.deleteAttachment(url));
    await Promise.all(deletePromises);
  }

  /**
   * Downloads single attachment using multiple fallback strategies
   * @param attachment - Attachment to download
   */
  async downloadSingleAttachment(attachment: TaskAttachment): Promise<void> {
    return await runInInjectionContext(this.injector, async () => {
      this.validateDownloadUrl(attachment);

      const blob = await downloadWithFallback(
        this.storage,
        this.auth,
        attachment.downloadURL!,
        attachment.filename
      );

      if (blob) {
        downloadBlobToFile(blob, attachment.filename);
      }
    });
  }

  /**
   * Validates attachment has download URL
   * @param attachment - Attachment to validate
   * @throws Error if no download URL
   */
  private validateDownloadUrl(attachment: TaskAttachment): void {
    if (!attachment.downloadURL) {
      throw new Error('No download URL available for attachment');
    }
  }

  /**
   * Downloads all attachments as ZIP file
   * @param attachments - Array of attachments
   * @param zipName - Name for the ZIP file
   */
  async downloadAllAsZip(attachments: TaskAttachment[], zipName: string): Promise<void> {
    return await runInInjectionContext(this.injector, async () => {
      this.loadingService.show();

      try {
        const result = await createZipFromAttachments(this.storage, this.auth, attachments);
        downloadBlobToFile(result.zipBlob, `${zipName}.zip`);
        logZipSummary(result.successCount, result.errorCount);
      } catch (error) {
        console.error('Error creating ZIP:', error);
        throw error;
      } finally {
        this.loadingService.hide();
      }
    });
  }
}