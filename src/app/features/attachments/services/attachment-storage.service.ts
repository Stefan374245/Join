import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { TaskAttachment } from '../../../core/models/task.interface';
import { LoadingService } from '../../../core/services/loading.service';
import { formatBase64DataUrl } from '../helpers/base64-formatter.helper';
import { downloadBlobToFile, base64ToBlob } from '../helpers/blob-downloader.helper';
import { createZipFromAttachments, logZipSummary } from '../helpers/zip-creator.helper';

@Injectable({
  providedIn: 'root'
})
export class AttachmentStorageService {
  private storage = inject(Storage);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private loadingService = inject(LoadingService);

  async putBase64(filePath: string, base64: string, fileType: string): Promise<string> {
    return await runInInjectionContext(this.injector, async () => {
      const storageRef = ref(this.storage, filePath);
      const data = formatBase64DataUrl(base64, fileType);
      await uploadString(storageRef, data, 'data_url');
      return await getDownloadURL(storageRef);
    });
  }

  async delByPath(filePath?: string | null): Promise<void> {
    if (!filePath) return;
    try {
      await runInInjectionContext(this.injector, async () => {
        await deleteObject(ref(this.storage, filePath));
      });
    } catch {
      return;
    }
  }

  async downloadSingleAttachment(attachment: TaskAttachment): Promise<void> {
    return await runInInjectionContext(this.injector, async () => {
      const blob = base64ToBlob(attachment.base64, attachment.fileType);
      downloadBlobToFile(blob, attachment.filename);
    });
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
        const result = await createZipFromAttachments(attachments);
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