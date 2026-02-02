import { Injectable } from '@angular/core';
import { FILE_UPLOAD } from '../../shared/constants';

/**
 * Service for validating file uploads with security checks
 * Supports only JPEG and PNG image formats as per exam requirements
 */
@Injectable({
  providedIn: 'root'
})
export class FileValidationService {
  private readonly MAX_FILE_SIZE = FILE_UPLOAD.MAX_FILE_SIZE;
  private readonly ALLOWED_TYPES = FILE_UPLOAD.ALLOWED_TYPES;
  private readonly ALLOWED_EXTENSIONS = FILE_UPLOAD.ALLOWED_EXTENSIONS;

  private readonly MAGIC_BYTES = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47]
  } as const;

  /**
   * Validate file against all security checks
   * @param file - File to validate
   * @returns Promise resolving to validation result
   */
  async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const extensionCheck = this.validateExtension(file.name);
    if (!extensionCheck.valid) return extensionCheck;

    const typeCheck = this.validateMimeType(file.type);
    if (!typeCheck.valid) return typeCheck;

    const sizeCheck = this.validateFileSize(file.size);
    if (!sizeCheck.valid) return sizeCheck;

    return await this.validateMagicBytes(file);
  }

  /**
   * Validate file extension
   */
  private validateExtension(filename: string): { valid: boolean; error?: string } {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const isValid = this.ALLOWED_EXTENSIONS.includes(ext as any);
    
    return isValid 
      ? { valid: true }
      : { valid: false, error: 'Only JPEG and PNG files are allowed' };
  }

  /**
   * Validate MIME type
   */
  private validateMimeType(mimeType: string): { valid: boolean; error?: string } {
    const isValid = this.ALLOWED_TYPES.includes(mimeType as any);
    
    return isValid
      ? { valid: true }
      : { valid: false, error: 'Invalid file type. Only JPEG and PNG allowed' };
  }

  /**
   * Validate file size
   */
  private validateFileSize(size: number): { valid: boolean; error?: string } {
    return size <= this.MAX_FILE_SIZE
      ? { valid: true }
      : { valid: false, error: `File too large. Maximum size: 1MB` };
  }

  /**
   * Validate file using magic bytes (prevents .exe -> .jpg rename attacks)
   */
  private async validateMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const bytes = await this.readFileBytes(file, 8);
      const isJpeg = this.checkJpegMagicBytes(bytes);
      const isPng = this.checkPngMagicBytes(bytes);

      return (isJpeg || isPng)
        ? { valid: true }
        : { valid: false, error: 'File header invalid. File may be corrupted or renamed' };
    } catch (error) {
      return { valid: false, error: 'Failed to read file' };
    }
  }

  /**
   * Read first N bytes from file
   */
  private readFileBytes(file: File, numBytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer);
        resolve(arr);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(0, numBytes));
    });
  }

  /**
   * Check JPEG magic bytes (FF D8 FF)
   */
  private checkJpegMagicBytes(bytes: Uint8Array): boolean {
    return bytes[0] === this.MAGIC_BYTES.jpeg[0] &&
           bytes[1] === this.MAGIC_BYTES.jpeg[1] &&
           bytes[2] === this.MAGIC_BYTES.jpeg[2];
  }

  /**
   * Check PNG magic bytes (89 50 4E 47)
   */
  private checkPngMagicBytes(bytes: Uint8Array): boolean {
    return bytes[0] === this.MAGIC_BYTES.png[0] &&
           bytes[1] === this.MAGIC_BYTES.png[1] &&
           bytes[2] === this.MAGIC_BYTES.png[2] &&
           bytes[3] === this.MAGIC_BYTES.png[3];
  }
}
