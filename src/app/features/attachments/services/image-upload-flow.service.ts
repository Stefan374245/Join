import { Injectable, inject } from '@angular/core';
import { FileValidationService } from './file-validation.service';
import { ImageCompressionService } from './image-compression.service';

export interface ImgUpload {
  base64: string;
  fileType: 'image/jpeg' | 'image/png';
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadFlowService {
  private fileValidation = inject(FileValidationService);
  private imageCompression = inject(ImageCompressionService);

  async proc(file: File): Promise<ImgUpload> {
    const valid = await this.fileValidation.validateFile(file);
    if (!valid.valid) throw new Error(valid.error || 'Invalid image file');

    const base64 = await this.imageCompression.compressImage(file);
    return { base64, fileType: this.toType(file.type) };
  }

  private toType(type: string): 'image/jpeg' | 'image/png' {
    return type === 'image/png' ? 'image/png' : 'image/jpeg';
  }
}
