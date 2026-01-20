import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { TaskAttachment } from '../models/task.interface';

/**
 * Service for uploading attachments to Firebase Storage
 */
@Injectable({
  providedIn: 'root'
})
export class AttachmentStorageService {
  private storage = inject(Storage);
  private auth = inject(Auth);
  private injector = inject(Injector);

  /**
   * Upload attachment to Firebase Storage
   * @param attachment - Attachment with base64 data
   * @param taskId - Task ID for folder structure
   * @returns Promise with download URL
   */
  async uploadAttachment(attachment: TaskAttachment, taskId: string): Promise<string> {
    return await runInInjectionContext(this.injector, async () => {
      const filePath = `tasks/${taskId}/attachments/${attachment.id}_${attachment.filename}`;
      const storageRef = ref(this.storage, filePath);
      
      const base64Data = attachment.base64.startsWith('data:') 
        ? attachment.base64 
        : `data:${attachment.fileType};base64,${attachment.base64}`;
      
      await uploadString(storageRef, base64Data, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    });
  }

  /**
   * Upload multiple attachments
   * @param attachments - Array of attachments
   * @param taskId - Task ID for folder structure
   * @returns Promise with array of download URLs
   */
  async uploadAttachments(attachments: TaskAttachment[], taskId: string): Promise<string[]> {
    const uploadPromises = attachments.map(att => this.uploadAttachment(att, taskId));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete attachment from Firebase Storage
   * @param downloadURL - Download URL of the file
   */
  async deleteAttachment(downloadURL: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const storageRef = ref(this.storage, downloadURL);
      await deleteObject(storageRef);
    });
  }

  /**
   * Delete multiple attachments
   * @param downloadURLs - Array of download URLs
   */
  async deleteAttachments(downloadURLs: string[]): Promise<void> {
    const deletePromises = downloadURLs.map(url => this.deleteAttachment(url));
    await Promise.all(deletePromises);
  }
}
