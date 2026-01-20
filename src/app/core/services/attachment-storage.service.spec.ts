import { TestBed } from '@angular/core/testing';
import { AttachmentStorageService } from './attachment-storage.service';

describe('AttachmentStorageService', () => {
  let service: AttachmentStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttachmentStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
