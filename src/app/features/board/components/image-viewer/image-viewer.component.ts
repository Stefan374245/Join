import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AttachmentStorageService } from '../../../../core/services/attachment-storage.service';
import { TaskAttachment } from '../../../../core/models/task.interface';

/**
 * Modern Angular 19 Signal-based Image Viewer
 * Full-featured viewer with 3D animations, zoom, rotation, touch gestures, and download
 */
@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewerComponent {
  
  images = input.required<TaskAttachment[]>();
  initialIndex = input<number>(0);
  isEditMode = input<boolean>(false);
  taskTitle = input<string>('Untitled');

  close = output<void>();
  delete = output<TaskAttachment>();
  deleteAll = output<void>();

  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private attachmentStorageService = inject(AttachmentStorageService);
  private liveAnnouncer = inject(LiveAnnouncer);

  private windowWidthSignal = signal<number>(window.innerWidth);
  private touchStartXSignal = signal<number>(0);
  private touchStartYSignal = signal<number>(0);

  currentIndex = signal<number>(0);
  zoomLevel = signal<number>(1);
  rotation = signal<number>(0);
  panPosition = signal<{x: number, y: number}>({x: 0, y: 0});
  isPanning = signal<boolean>(false);
  showActionPopup = signal<boolean>(false);
  actionPopupPosition = signal<{x: number, y: number}>({x: 0, y: 0});
  animationDirection = signal<'next' | 'prev' | null>(null);
  imageLoadError = signal<boolean>(false);
  imageLoadingStates = signal<Map<number, boolean>>(new Map());

  isMobile = computed(() => this.windowWidthSignal() < 992);
  isFullscreen = computed(() => this.isMobile());
  
  currentImage = computed(() => {
    const images = this.images();
    const index = this.currentIndex();
    return images[index];
  });
  
  hasNext = computed(() => {
    return this.currentIndex() < this.images().length - 1;
  });
  
  hasPrevious = computed(() => {
    return this.currentIndex() > 0;
  });
  
  imageUrls = computed(() => {
    return this.images().map(att => this.getImageUrl(att));
  });
  
  /**
   * Performance optimization: Only render current + adjacent images
   */
  renderedIndices = computed(() => {
    const curr = this.currentIndex();
    const prev = curr - 1;
    const next = curr + 1;
    const length = this.images().length;
    
    return [prev, curr, next].filter(i => i >= 0 && i < length);
  });
  
  imageCounter = computed(() => {
    return `${this.currentIndex() + 1} / ${this.images().length}`;
  });

  // ============================================
  // CONSTRUCTOR & EFFECTS
  // ============================================
  constructor() {
    effect(() => {
      const initial = this.initialIndex();
      const length = this.images().length;
      if (initial >= 0 && initial < length) {
        this.currentIndex.set(initial);
      }
    });

    effect(() => {
      const indices = this.renderedIndices();
      const urls = this.imageUrls();
      
      indices.forEach(idx => {
        const url = urls[idx];
        if (url) {
          this.preloadImage(url);
        }
      });
    });

    this.setupEventListeners();
  }

  /**
   * Setup window resize and body scroll lock
   */
  private setupEventListeners(): void {
    const resizeHandler = () => {
      this.windowWidthSignal.set(window.innerWidth);
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // Cleanup effect
    effect((onCleanup) => {
      onCleanup(() => {
        window.removeEventListener('resize', resizeHandler);
      });
    });

    this.setupBodyScrollLock();
  }

  /**
   * Lock body scroll when viewer is open
   */
  private setupBodyScrollLock(): void {
    effect(() => {
      if (this.images().length > 0) {
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        document.body.style.overflow = '';
      };
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  
  /**
   * Get display URL for attachment
   */
  private getImageUrl(attachment: TaskAttachment): string {
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    
    // Fallback to base64
    if (attachment.base64.startsWith('data:')) {
      return attachment.base64;
    }
    
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

  /**
   * Check if image is loading
   */
  isImageLoading(index: number): boolean {
    return this.imageLoadingStates().get(index) ?? true;
  }

  /**
   * Handle image load start
   */
  onImageLoadStart(index: number): void {
    const states = new Map(this.imageLoadingStates());
    states.set(index, true);
    this.imageLoadingStates.set(states);
  }

  /**
   * Handle image load complete
   */
  onImageLoaded(index: number): void {
    const states = new Map(this.imageLoadingStates());
    states.set(index, false);
    this.imageLoadingStates.set(states);
  }

  /**
   * Preload image for smooth transitions
   */
  private preloadImage(url: string): void {
    const img = new Image();
    img.src = url;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Get preview URL for thumbnails
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    return this.getImageUrl(attachment);
  }

  /**
   * Get transform for current image (zoom, rotation, pan)
   */
  getImageTransform(): string {
    const zoom = this.zoomLevel();
    const rotate = this.rotation();
    const pan = this.panPosition();
    
    // Important: translate before rotate to avoid coordinate system issues
    return `translate(${pan.x}px, ${pan.y}px) rotate(${rotate}deg) scale(${zoom})`;
  }

  // Methods will be added in next steps...

  // ============================================
  // NAVIGATION METHODS
  // ============================================
  
  /**
   * Navigate to next image
   */
  navigateNext(): void {
    const length = this.images().length;
    if (length === 0) return;
    this.animationDirection.set('next');
    this.currentIndex.update(i => (i + 1) % length);
    this.resetImageState();
    this.announceCurrentImage();
    setTimeout(() => this.animationDirection.set(null), 500);
  }

  /**
   * Navigate to previous image
   */
  navigatePrev(): void {
    const length = this.images().length;
    if (length === 0) return;
    this.animationDirection.set('prev');
    this.currentIndex.update(i => (i - 1 + length) % length);
    this.resetImageState();
    this.announceCurrentImage();
    setTimeout(() => this.animationDirection.set(null), 500);
  }

  /**
   * Jump to specific image by index
   */
  jumpToImage(index: number): void {
    if (index < 0 || index >= this.images().length) return;
    if (index === this.currentIndex()) return;
    
    const direction = index > this.currentIndex() ? 'next' : 'prev';
    this.animationDirection.set(direction);
    this.currentIndex.set(index);
    this.resetImageState();
    this.announceCurrentImage();
    
    // Reset animation direction after animation completes (500ms)
    setTimeout(() => this.animationDirection.set(null), 500);
  }

  /**
   * Announce current image to screen readers
   */
  private announceCurrentImage(): void {
    const img = this.currentImage();
    const message = `Image ${this.currentIndex() + 1} of ${this.images().length}: ${img.filename}`;
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Reset image state (zoom, rotation, pan)
   */
  private resetImageState(): void {
    this.zoomLevel.set(1);
    this.rotation.set(0);
    this.panPosition.set({x: 0, y: 0});
    this.imageLoadError.set(false);
  }

  // ============================================
  // ZOOM & ROTATION
  // ============================================
  
  /**
   * Zoom in
   */
  zoomIn(): void {
    this.zoomLevel.update(z => Math.min(z + 0.25, 4));
  }

  /**
   * Zoom out
   */
  zoomOut(): void {
    this.zoomLevel.update(z => Math.max(z - 0.25, 0.5));
  }

  /**
   * Rotate image 90 degrees clockwise
   */
  rotate90(): void {
    this.rotation.update(r => (r + 90) % 360);
  }

  /**
   * Close viewer and emit close event
   */
  closeViewer(): void {
    this.resetImageState();
    this.close.emit();
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch(event.key) {
      case 'Escape':
        this.closeViewer();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigatePrev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateNext();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
      case 'r':
      case 'R':
        this.rotate90();
        break;
    }
  }

  // ============================================
  // TOUCH GESTURES
  // ============================================
  
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartXSignal.set(event.touches[0].clientX);
      this.touchStartYSignal.set(event.touches[0].clientY);
    } else if (event.touches.length === 2 && this.zoomLevel() > 1) {
      this.isPanning.set(true);
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (this.isPanning() && event.touches.length === 2) {
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartXSignal();
      const deltaY = touch.clientY - this.touchStartYSignal();
      
      this.panPosition.update(pos => ({
        x: pos.x + deltaX,
        y: pos.y + deltaY
      }));
      
      this.touchStartXSignal.set(touch.clientX);
      this.touchStartYSignal.set(touch.clientY);
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.isPanning.set(false);
    
    if (event.changedTouches.length === 0) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.touchStartXSignal();
    const deltaY = touchEndY - this.touchStartYSignal();
    
    // Swipe detection (horizontal swipe with > 50px threshold)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.navigatePrev();
      } else {
        this.navigateNext();
      }
    }
  }

  // ============================================
  // DOWNLOAD & ACTION POPUP
  // ============================================
  
  /**
   * Toggle action popup for download options
   */
  toggleActionPopup(event: MouseEvent): void {
    event.stopPropagation();
    
    this.actionPopupPosition.set({
      x: event.clientX - 100,
      y: event.clientY - 80
    });
    
    this.showActionPopup.update(v => !v);
  }

  /**
   * Download single image
   */
  async onDownloadSingle(): Promise<void> {
    this.showActionPopup.set(false);
    const img = this.currentImage();
    await this.attachmentStorageService.downloadSingleAttachment(img);
  }

  /**
   * Download all images as ZIP
   */
  async onDownloadAll(): Promise<void> {
    this.showActionPopup.set(false);
    await this.attachmentStorageService.downloadAllAsZip(this.images(), this.taskTitle());
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    this.imageLoadError.set(true);
    this.toastService.showError('Failed to load image');
  }
}

