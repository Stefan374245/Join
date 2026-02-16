import { Injectable } from '@angular/core';
import { IMAGE_COMPRESSION } from '../../../shared/constants';

/**
 * Service for compressing images to meet exam requirements
 * Target: 800x800px max dimensions, 70% JPEG quality
 */
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

  private checkSize(base64: string, maxBytes: number): void {
    if (this.bytes(base64) <= maxBytes) return;
    throw new Error(`Compressed image too large. Maximum size: ${this.mb(maxBytes)}MB`);
  }

  private bytes(base64: string): number {
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
  }

  private mb(bytes: number): number {
    return Math.round((bytes / (1024 * 1024)) * 10) / 10;
  }

  /**
   * Load image from file
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
   */
  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    return ctx;
  }

  /**
   * Draw image on canvas
   */
  private drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  /**
   * Convert canvas to base64 string
   */
  private canvasToBase64(canvas: HTMLCanvasElement, mimeType: string): string {
    const format = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const base64 = canvas.toDataURL(format, this.COMPRESSION_QUALITY);
    return base64.split(',')[1];
  }
}
