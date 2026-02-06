/**
 * Public API for Attachments Feature Module
 * Centralized exports for all attachment-related functionality
 */

// Components
export { AttachmentUploadComponent } from './components/attachment-upload/attachment-upload.component';
export { AttachmentsDisplayComponent } from './components/attachments-display/attachments-display.component';
export { ImageViewerComponent } from './components/image-viewer/image-viewer.component';

// Services
export { AttachmentStorageService } from './services/attachment-storage.service';
export { FileValidationService } from './services/file-validation.service';
export { ImageCompressionService } from './services/image-compression.service';

// Helper Functions
export { createAuthHeaders, createAuthFetchOptions } from './helpers/auth-helper';
export { formatBase64DataUrl, extractBase64Data } from './helpers/base64-formatter.helper';
export { downloadBlobToFile } from './helpers/blob-downloader.helper';
export { downloadViaNewTab, type DownloadResult } from './helpers/download-strategies.helper';
export { type ZipResult, logZipSummary } from './helpers/zip-creator.helper';
