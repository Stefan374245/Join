import { Injectable } from '@angular/core';

/**
 * Service for compressing images to meet exam requirements
 * Target: 800x800px max dimensions, 70% JPEG quality
 */
@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {
  private readonly MAX_DIMENSION = 800;
  private readonly COMPRESSION_QUALITY = 0.7;

  /**
   * Compress image to base64 string
   * @param file - Image file to compress
   * @returns Promise resolving to base64 string
   */
  async compressImage(file: File): Promise<string> {
    const img = await this.loadImage(file);
    const canvas = this.createCanvas(img);
    const ctx = this.getContext(canvas);
    
    this.drawImage(ctx, img, canvas.width, canvas.height);
    return this.canvasToBase64(canvas, file.type);
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
    return base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
  }
}
