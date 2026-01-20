import { TestBed } from '@angular/core/testing';
import { FileValidationService } from './file-validation.service';

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('File Extension Validation', () => {
    it('should accept .jpg files', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept .jpeg files', async () => {
      const file = new File([''], 'test.jpeg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept .png files', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject .gif files', async () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only JPEG and PNG files are allowed');
    });

    it('should reject .exe files', async () => {
      const file = new File([''], 'malware.exe', { type: 'application/exe' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('MIME Type Validation', () => {
    it('should accept image/jpeg MIME type', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept image/png MIME type', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject image/gif MIME type', async () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 1MB', async () => {
      const smallContent = new Array(500 * 1024).fill('a').join('');
      const file = new File([smallContent], 'test.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject files over 1MB', async () => {
      const largeContent = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should accept exactly 1MB file', async () => {
      const exactContent = new Array(1024 * 1024).fill('a').join('');
      const file = new File([exactContent], 'exact.jpg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Magic Bytes Validation', () => {
    it('should detect valid JPEG magic bytes', async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should detect valid PNG magic bytes', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const blob = new Blob([pngBytes], { type: 'image/png' });
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject renamed .exe file as .jpg', async () => {
      // MZ header (exe file)
      const exeBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]);
      const blob = new Blob([exeBytes], { type: 'image/jpeg' });
      const file = new File([blob], 'malware.jpg', { type: 'image/jpeg' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File header invalid');
    });

    it('should reject file with invalid magic bytes', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([invalidBytes], { type: 'image/jpeg' });
      const file = new File([blob], 'invalid.jpg', { type: 'image/jpeg' });
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Case Sensitivity', () => {
    it('should accept uppercase .JPG extension', async () => {
      const file = new File([''], 'test.JPG', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept mixed case .JpEg extension', async () => {
      const file = new File([''], 'test.JpEg', { type: 'image/jpeg' });
      spyOn<any>(service, 'validateMagicBytes').and.returnValue(Promise.resolve({ valid: true }));
      
      const result = await service.validateFile(file);
      
      expect(result.valid).toBe(true);
    });
  });
});
