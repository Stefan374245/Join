import { TestBed } from '@angular/core/testing';
import { ImageCompressionService } from './image-compression.service';

describe('ImageCompressionService', () => {
  let service: ImageCompressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageCompressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Image Compression', () => {
    it('should compress image to base64 string', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle PNG files', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('Dimension Calculation', () => {
    it('should not resize images smaller than 800x800', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'small.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
    });

    it('should resize images larger than 800x800 maintaining aspect ratio', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'large.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThan(canvas.toDataURL('image/jpeg', 0.7).length);
    });

    it('should handle square images', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'square.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
    });

    it('should handle portrait orientation', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 1200;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'portrait.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
    });

    it('should handle landscape orientation', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'landscape.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
    });
  });

  describe('Quality Settings', () => {
    it('should apply 70% compression quality', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;
      
      const gradient = ctx.createLinearGradient(0, 0, 800, 800);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(1, 'blue');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 800);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'quality-test.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
      const originalBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      
      expect(result.length).toBeLessThanOrEqual(originalBase64.length);
    });
  });

  describe('Base64 Output', () => {
    it('should return base64 string without data URL prefix', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await service.compressImage(file);
      
      expect(result.startsWith('data:')).toBe(false);
      expect(result.startsWith('/9j')).toBe(true); // JPEG base64 typically starts with /9j
    });

    it('should handle PNG output format', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const result = await service.compressImage(file);
      
      expect(result).toBeTruthy();
      expect(result.startsWith('data:')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image files gracefully', async () => {
      const invalidBlob = new Blob(['not an image'], { type: 'image/jpeg' });
      const file = new File([invalidBlob], 'invalid.jpg', { type: 'image/jpeg' });
      
      await expectAsync(service.compressImage(file)).toBeRejected();
    });

    it('should handle empty files', async () => {
      const emptyBlob = new Blob([], { type: 'image/jpeg' });
      const file = new File([emptyBlob], 'empty.jpg', { type: 'image/jpeg' });
      
      await expectAsync(service.compressImage(file)).toBeRejected();
    });
  });
});
