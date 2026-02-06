import { Injectable } from '@angular/core';
import { FILE_UPLOAD } from '../../../shared/constants';

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
   * @param filename - Name of the file to validate
   * @returns Validation result with error message if invalid
   * @remarks Checks if the file extension is among the allowed extensions (.jpg, .jpeg, .png)
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
   * @param mimeType - MIME type of the file to validate
   * @returns Validation result with error message if invalid
   * @remarks Checks if the MIME type is among the allowed types (image/jpeg, image/png)
   */
  private validateMimeType(mimeType: string): { valid: boolean; error?: string } {
    const isValid = this.ALLOWED_TYPES.includes(mimeType as any);
    
    return isValid
      ? { valid: true }
      : { valid: false, error: 'Invalid file type. Only JPEG and PNG allowed' };
  }

  /**
   * Validate file size
   * @param size - Size of the file in bytes
   * @returns Validation result with error message if invalid
   * @remarks Checks if the file size does not exceed the maximum allowed size (1MB)
   */
  private validateFileSize(size: number): { valid: boolean; error?: string } {
    return size <= this.MAX_FILE_SIZE
      ? { valid: true }
      : { valid: false, error: `File too large. Maximum size: 1MB` };
  }

  /**
   * Validate file using magic bytes (prevents .exe -> .jpg rename attacks)
   * @param file - File to validate
   * @returns Promise resolving to validation result with error message if invalid
   * @remarks Reads the first few bytes of the file and checks against known magic byte signatures for JPEG and PNG formats to ensure the file content matches its extension and MIME type.
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
   * @param file - File to read
   * @param numBytes - Number of bytes to read
   * @returns Promise resolving to Uint8Array of the read bytes
   * @remarks Uses FileReader API to read a slice of the file as an ArrayBuffer, which is then converted to a Uint8Array for magic byte validation.
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
   * @param bytes - Uint8Array of the file's initial bytes
   * @returns True if bytes match JPEG signature, false otherwise
   * @remarks Validates that the first three bytes of the file match the JPEG magic byte signature (FF D8 FF), which is a common way to verify that a file is indeed a JPEG image.
   */
  private checkJpegMagicBytes(bytes: Uint8Array): boolean {
    return bytes[0] === this.MAGIC_BYTES.jpeg[0] &&
           bytes[1] === this.MAGIC_BYTES.jpeg[1] &&
           bytes[2] === this.MAGIC_BYTES.jpeg[2];
  }

  /**
   * Check PNG magic bytes (89 50 4E 47)
   * @param bytes - Uint8Array of the file's initial bytes
   */
  private checkPngMagicBytes(bytes: Uint8Array): boolean {
    return bytes[0] === this.MAGIC_BYTES.png[0] &&
           bytes[1] === this.MAGIC_BYTES.png[1] &&
           bytes[2] === this.MAGIC_BYTES.png[2] &&
           bytes[3] === this.MAGIC_BYTES.png[3];
  }
}
