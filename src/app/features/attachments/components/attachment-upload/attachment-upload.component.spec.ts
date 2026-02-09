import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachmentUploadComponent } from '../../../attachments/components/attachment-upload/attachment-upload.component';
import { FileValidationService } from '../../../../features/attachments/services/file-validation.service';
import { ImageCompressionService } from '../../../../features/attachments/services/image-compression.service';

describe('AttachmentUploadComponent', () => {
  let component: AttachmentUploadComponent;
  let fixture: ComponentFixture<AttachmentUploadComponent>;
  let fileValidationService: jasmine.SpyObj<FileValidationService>;
  let imageCompressionService: jasmine.SpyObj<ImageCompressionService>;

  beforeEach(async () => {
    const fileValidationSpy = jasmine.createSpyObj('FileValidationService', ['validateFile']);
    const imageCompressionSpy = jasmine.createSpyObj('ImageCompressionService', ['compressImage']);

    await TestBed.configureTestingModule({
      imports: [AttachmentUploadComponent],
      providers: [
        { provide: FileValidationService, useValue: fileValidationSpy },
        { provide: ImageCompressionService, useValue: imageCompressionSpy }
      ]
    }).compileComponents();

    fileValidationService = TestBed.inject(FileValidationService) as jasmine.SpyObj<FileValidationService>;
    imageCompressionService = TestBed.inject(ImageCompressionService) as jasmine.SpyObj<ImageCompressionService>;
    
    fixture = TestBed.createComponent(AttachmentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty attachments', () => {
    expect(component.attachments()).toEqual([]);
  });

  it('should set drag over state to true on drag over', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.isDragOver()).toBe(true);
  });

  it('should set drag over state to false on drag leave', () => {
    const event = new DragEvent('dragleave');
    component.isDragOver.set(true);

    component.onDragLeave(event);

    expect(component.isDragOver()).toBe(false);
  });

  it('should validate and process file on valid upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fileValidationService.validateFile.and.returnValue(Promise.resolve({ valid: true }));
    imageCompressionService.compressImage.and.returnValue(Promise.resolve('base64string'));

    const event = { target: { files: [mockFile], value: '' } } as any;
    
    await component.onFileSelected(event);

    expect(fileValidationService.validateFile).toHaveBeenCalledWith(mockFile);
    expect(imageCompressionService.compressImage).toHaveBeenCalledWith(mockFile);
    expect(component.attachments().length).toBe(1);
  });

  it('should show error message on invalid file', async () => {
    const mockFile = new File(['test'], 'test.exe', { type: 'application/exe' });
    fileValidationService.validateFile.and.returnValue(
      Promise.resolve({ valid: false, error: 'Invalid file type' })
    );

    const event = { target: { files: [mockFile], value: '' } } as any;
    
    await component.onFileSelected(event);

    expect(component.errorMessage()).toBe('Invalid file type');
    expect(component.attachments().length).toBe(0);
  });

  it('should remove attachment by id', () => {
    component.attachments.set([
      { id: '1', filename: 'test1.jpg', fileType: 'image/jpeg', base64: 'xxx', size: 1000, uploadedAt: new Date() },
      { id: '2', filename: 'test2.jpg', fileType: 'image/jpeg', base64: 'yyy', size: 2000, uploadedAt: new Date() }
    ]);

    component.removeAttachment('1');

    expect(component.attachments().length).toBe(1);
    expect(component.attachments()[0].id).toBe('2');
  });

  it('should remove all attachments', () => {
    component.attachments.set([
      { id: '1', filename: 'test1.jpg', fileType: 'image/jpeg', base64: 'xxx', size: 1000, uploadedAt: new Date() }
    ]);

    component.removeAllAttachments();

    expect(component.attachments()).toEqual([]);
  });

  it('should emit attachments change on update', () => {
    spyOn(component.attachmentsChange, 'emit');
    const attachment = { id: '1', filename: 'test.jpg', fileType: 'image/jpeg' as const, base64: 'xxx', size: 1000, uploadedAt: new Date() };

    component.attachments.set([attachment]);
    component.attachmentsChange.emit(component.attachments());

    expect(component.attachmentsChange.emit).toHaveBeenCalledWith([attachment]);
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(500)).toBe('500 B');
    expect(component.formatFileSize(1024)).toBe('1.0 KB');
    expect(component.formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('should generate preview URL with correct prefix', () => {
    const attachment = {
      id: '1',
      filename: 'test.jpg',
      fileType: 'image/jpeg' as const,
      base64: 'base64data',
      size: 1000,
      uploadedAt: new Date()
    };

    const url = component.getPreviewUrl(attachment);

    expect(url).toBe('data:image/jpeg;base64,base64data');
  });
});
