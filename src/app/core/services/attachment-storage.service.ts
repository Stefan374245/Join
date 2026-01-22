import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL, deleteObject, getBlob } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { TaskAttachment } from '../models/task.interface';
import JSZip from 'jszip';
import { LoadingService } from './loading.service';

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
  private loadingService = inject(LoadingService);

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

  /**
   * Download single attachment
   * Strategy: Try multiple approaches to handle CORS issues
   * @param attachment - Attachment to download
   */
  async downloadSingleAttachment(attachment: TaskAttachment): Promise<void> {
    return await runInInjectionContext(this.injector, async () => {
      try {
        if (!attachment.downloadURL) {
          throw new Error('No download URL available for attachment');
        }

        console.log('Downloading attachment:', attachment.filename);
        
        try {
          // Try Firebase Storage getBlob() first
          const storageRef = ref(this.storage, attachment.downloadURL);
          const blob = await getBlob(storageRef);
          this.downloadBlob(blob, attachment.filename);
          return;
        } catch (blobError) {
          console.warn('getBlob failed (CORS issue), trying fetch with auth token:', blobError);
          
          // Fallback: Use fetch with Firebase Auth token
          try {
            const user = this.auth.currentUser;
            const token = user ? await user.getIdToken() : null;
            
            const headers: HeadersInit = {
              'Accept': '*/*',
            };
            
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(attachment.downloadURL, {
              method: 'GET',
              mode: 'cors',
              credentials: 'include',
              headers: headers
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            this.downloadBlob(blob, attachment.filename);
            return;
          } catch (fetchError) {
            console.warn('Fetch failed, opening in new tab as last resort:', fetchError);
            
            // Last resort: Open in new tab
            const link = document.createElement('a');
            link.href = attachment.downloadURL;
            link.target = '_blank';
            link.download = attachment.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
        
      } catch (error) {
        console.error('Error downloading attachment:', error);
        throw error;
      }
    });
  }

  /**
   * Download all attachments as ZIP
   * Strategy: Try multiple approaches to handle CORS issues
   * @param attachments - Array of attachments
   * @param zipName - Name for the ZIP file
   */
  async downloadAllAsZip(attachments: TaskAttachment[], zipName: string): Promise<void> {
    return await runInInjectionContext(this.injector, async () => {
      this.loadingService.show();
      
      try {
        const zip = new JSZip();
        let successCount = 0;
        let errorCount = 0;
        
        for (const attachment of attachments) {
          try {
            if (!attachment.downloadURL) {
              console.warn(`Skipping attachment ${attachment.filename}: downloadURL missing`);
              errorCount++;
              continue;
            }

            let blob: Blob;
            
            try {
              // Try Firebase Storage getBlob() first
              const storageRef = ref(this.storage, attachment.downloadURL);
              blob = await getBlob(storageRef);
            } catch (blobError) {
              console.warn(`getBlob failed for ${attachment.filename}, trying fetch with auth:`, blobError);
              
              // Fallback: Use fetch with Firebase Auth token
              const user = this.auth.currentUser;
              const token = user ? await user.getIdToken() : null;
              
              const headers: HeadersInit = {
                'Accept': '*/*',
              };
              
              if (token) {
                headers['Authorization'] = `Bearer ${token}`;
              }
              
              const response = await fetch(attachment.downloadURL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: headers
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              
              blob = await response.blob();
            }
            
            zip.file(attachment.filename, blob);
            successCount++;
            
          } catch (error) {
            console.error(`Error adding ${attachment.filename} to ZIP:`, error);
            errorCount++;
          }
        }

        if (successCount === 0) {
          throw new Error('No files could be added to ZIP. All attachments failed to download.');
        }

        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        this.downloadBlob(zipBlob, `${zipName}.zip`);
        
        if (errorCount > 0) {
          console.warn(`ZIP created with ${successCount} files. ${errorCount} files failed.`);
        }
      } catch (error) {
        console.error('Error creating ZIP:', error);
        throw error;
      } finally {
        this.loadingService.hide();
      }
    });
  }

  /**
   * Download blob as file
   * @param blob - Blob to download
   * @param filename - Filename for download
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

}