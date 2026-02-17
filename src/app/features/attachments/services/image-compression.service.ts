import { Injectable } from '@angular/core';
import { IMAGE_COMPRESSION } from '../../../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {
  private readonly MAX_DIMENSION = IMAGE_COMPRESSION.MAX_DIMENSION;
  private readonly COMPRESSION_QUALITY = IMAGE_COMPRESSION.QUALITY;
  private readonly MAX_OUTPUT_SIZE = IMAGE_COMPRESSION.MAX_OUTPUT_SIZE;

  /**
   * Compress image to base64 string
   * @param file - Image file to compress
   * @returns Promise resolving to base64 string
   */
  async compressImage(file: File, maxOutputSize = this.MAX_OUTPUT_SIZE): Promise<string> {
    const img = await this.loadImage(file);
    const canvas = this.createCanvas(img);
    const ctx = this.getContext(canvas);
    
    this.drawImage(ctx, img, canvas.width, canvas.height);
    const base64 = this.canvasToBase64(canvas, file.type);
    this.checkSize(base64, maxOutputSize);
    return base64;
  }

  /**
   * Check if compressed image exceeds size limit
   * @param base64 - Base64 string of compressed image
   * @param maxBytes - Maximum allowed size in bytes
   * @returns {void}
   * @throws Error if compressed image exceeds size limit
    * @remarks This ensures that the compressed image can be stored in Firestore without exceeding limits. Adjust maxBytes as needed for different use cases.
   */
  private checkSize(base64: string, maxBytes: number): void {
    if (this.bytes(base64) <= maxBytes) return;
    throw new Error(`Compressed image too large. Maximum size: ${this.mb(maxBytes)}MB`);
  }

  /**
   * Calculate byte size of base64 string
   * @param base64 - Base64 string
   * @returns {number} - Size in bytes
   * @remarks Accounts for padding characters to provide accurate byte size calculation. This is crucial for ensuring that the compressed image meets storage constraints.
   */
  private bytes(base64: string): number {
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
  }

  /**
   * Convert bytes to megabytes
   * @param bytes - Size in bytes
   * @returns {number} - Size in megabytes
   * @remarks Rounds to one decimal place for readability.
   */
  private mb(bytes: number): number {
    return Math.round((bytes / (1024 * 1024)) * 10) / 10;
  }

  /**
   * Load image from file
   * @param file - Image file to load
   * @returns Promise resolving to HTMLImageElement
   * @remarks Creates an object URL for the file and loads it into an Image element. This allows us to access the image's dimensions for proper resizing while maintaining aspect ratio.
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create canvas with calculated dimensions
   * @param img - Loaded image element
   * @returns HTMLCanvasElement with appropriate dimensions for compression
   * @remarks The canvas is sized based on the original image dimensions while maintaining aspect ratio. This ensures that the compressed image retains visual quality without exceeding the maximum dimension constraints.
   */
  private createCanvas(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const dimensions = this.calculateDimensions(img.width, img.height);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    return canvas;
  }

  /**
   * Calculate dimensions maintaining aspect ratio
   * @param width - Original image width
   * @param height - Original image height
   * @returns Object containing new width and height
   * @remarks If the original dimensions are within the maximum limits, they are returned unchanged. Otherwise, the dimensions are scaled down proportionally to fit within the maximum dimension while preserving the aspect ratio. This prevents distortion of the image during compression.
   */
  private calculateDimensions(width: number, height: number): { width: number; height: number } {
    if (width <= this.MAX_DIMENSION && height <= this.MAX_DIMENSION) {
      return { width, height };
    }

    const ratio = Math.min(this.MAX_DIMENSION / width, this.MAX_DIMENSION / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  /**
   * Get 2D rendering context
   * @param canvas - Canvas element to get context from
   * @return CanvasRenderingContext2D
   * @remarks Throws an error if the context cannot be obtained, which is critical for the compression process. The 2D context is used to draw the image onto the canvas and perform the compression.
   */
  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    return ctx;
  }

  /**
   * Draw image on canvas
   * @param ctx - Canvas rendering context
   * @param img - Image element to draw
   * @param width - Width to draw the image
   * @param height - Height to draw the image
   * @remarks Fills the canvas with a white background before drawing the image to ensure consistent appearance, especially for images with transparency.
   */
  private drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  /**
   * Convert canvas to base64 string
   * @param canvas - Canvas element to convert
   * @param mimeType - MIME type of the original image file
   * @return Base64 string of the compressed image
   * @remarks Uses the appropriate MIME type for the output format (JPEG or PNG) and applies the specified compression quality. The resulting base64 string is extracted from the data URL format for storage or transmission.
   */
  private canvasToBase64(canvas: HTMLCanvasElement, mimeType: string): string {
    const format = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const base64 = canvas.toDataURL(format, this.COMPRESSION_QUALITY);
    return base64.split(',')[1];
  }
}
