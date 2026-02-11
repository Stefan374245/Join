import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { StopPropagationDirective } from "../../../../shared/directives";
import { ToastService } from "../../../../core/services/toast.service";
import { AttachmentStorageService } from "../../services/attachment-storage.service";
import { TaskAttachment } from "../../../../core/models/task.interface";
import { formatFileSize } from "../../../../shared/utils";
import { LoadingSpinnerComponent } from "../../../../shared/components/loading-spinner/loading-spinner.component";

/**
 * Modern Angular 19 Signal-based Image Viewer
 * Full-featured viewer with 3D animations, zoom, rotation, touch gestures, and download
 */
@Component({
  selector: "app-image-viewer",
  standalone: true,
  imports: [
    CommonModule,
    StopPropagationDirective,
    LoadingSpinnerComponent,
  ],
  templateUrl: "./image-viewer.component.html",
  styleUrl: "./image-viewer.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent {
  images = input<TaskAttachment[]>([]);
  initialIndex = input<number>(0);
  isEditMode = input<boolean>(false);
  taskTitle = input<string>("Untitled");

  close = output<void>();
  delete = output<TaskAttachment>();
  deleteAll = output<void>();

  private toastService = inject(ToastService);
  private attachmentStorageService = inject(AttachmentStorageService);
  private liveAnnouncer = inject(LiveAnnouncer);

  private windowWidthSignal = signal<number>(window.innerWidth);
  private touchStartXSignal = signal<number>(0);
  private touchStartYSignal = signal<number>(0);

  currentIndex = signal<number>(0);
  previousIndex = signal<number | null>(null);
  zoomLevel = signal<number>(1);
  rotation = signal<number>(0);
  panPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  isPanning = signal<boolean>(false);
  showActionPopup = signal<boolean>(false);
  actionPopupPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  animationDirection = signal<"next" | "prev" | null>(null);
  imageLoadError = signal<boolean>(false);
  imageLoadingStates = signal<Map<number, boolean>>(new Map());
  thumbnailLoadingStates = signal<Map<string, boolean>>(new Map());
  isDownloading = signal<boolean>(false);

  isMobile = computed(() => this.windowWidthSignal() < 992);
  isFullscreen = computed(() => this.isMobile());

  currentImage = computed(() => {
    const images = this.images();
    if (!images || images.length === 0) return null as any;
    const index = this.currentIndex();
    return images[index];
  });

  hasNext = computed(() => {
    const images = this.images();
    if (!images || images.length === 0) return false;
    return this.currentIndex() < images.length - 1;
  });

  hasPrevious = computed(() => {
    return this.currentIndex() > 0;
  });

  imageUrls = computed(() => {
    const images = this.images();
    if (!images || images.length === 0) return [];
    return images.map((att) => this.getImageUrl(att));
  });

  renderedIndices = computed(() => {
    const images = this.images();
    if (!images || images.length === 0) return [];
    const curr = this.currentIndex();
    const prev = curr - 1;
    const next = curr + 1;
    const length = images.length;

    return [prev, curr, next].filter((i) => i >= 0 && i < length);
  });

  imageCounter = computed(() => {
    const images = this.images();
    if (!images || images.length === 0) return '0 / 0';
    return `${this.currentIndex() + 1} / ${images.length}`;
  });

  /**
   * Format file size for display (using shared utility)
   * @return Formatted file size string
   * @remarks Uses shared utility function
   */
  formatFileSize = formatFileSize;

  /**
   * Component constructor
   * @remarks Sets up reactive effects for initial index and image preloading, and event listeners for window resize and body scroll lock
   */
  constructor() {
    // Effect for initializing currentIndex - guards ensure safe execution
    effect(() => {
      const images = this.images();
      if (!images || images.length === 0) return;
      
      const initial = this.initialIndex();
      const length = images.length;
      if (initial >= 0 && initial < length) {
        this.currentIndex.set(initial);
      }
    });

    // Effect for preloading images
    effect(() => {
      const images = this.images();
      if (!images || images.length === 0) return;
      
      const indices = this.renderedIndices();
      const urls = this.imageUrls();

      indices.forEach((idx) => {
        const url = urls[idx];
        if (url) {
          this.preloadImage(url);
        }
      });
    });

    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for window resize and body scroll lock.
   * @remarks
   * - Window resize: Updates window width signal on resize to enable responsive behavior.
   * - Body scroll lock: Locks body scroll when images are present and restores it when the viewer is closed or images are removed.
   */
  private setupEventListeners(): void {
    const resizeHandler = () => {
      this.windowWidthSignal.set(window.innerWidth);
    };

    window.addEventListener("resize", resizeHandler);

    effect((onCleanup) => {
      onCleanup(() => {
        window.removeEventListener("resize", resizeHandler);
      });
    });

    this.setupBodyScrollLock();
  }

  /**
   * Locks body scroll when images are present and restores it when the viewer is closed or images are removed.
   * @remarks Uses reactive effect to monitor images and update body overflow style accordingly.
   */
  private setupBodyScrollLock(): void {
    effect(() => {
      if (this.images().length > 0) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    });
  }

  /**
   * Get display URL for attachment
   * @param attachment - Task attachment
   * @returns Display URL string
   * @remarks Uses downloadURL if available, otherwise constructs data URL from base64
   */
  private getImageUrl(attachment: TaskAttachment): string {
    if (attachment.downloadURL) {
      return attachment.downloadURL;
    }
    if (attachment.base64.startsWith("data:")) {
      return attachment.base64;
    }
    return `data:${attachment.fileType};base64,${attachment.base64}`;
  }

  /**
   * Check if image is loading
   * @param index - Image index
   * @returns True if image is loading, otherwise false
   * @remarks Uses internal loading states map
   */
  isImageLoading(index: number): boolean {
    return this.imageLoadingStates().get(index) ?? true;
  }

  /**
   * Handle image load start
   * @param index - Image index
   * @remarks Updates internal loading states map
   */
  onImageLoadStart(index: number): void {
    const states = new Map(this.imageLoadingStates());
    states.set(index, true);
    this.imageLoadingStates.set(states);
  }

  /**
   * Handle image load complete
   * @param index - Image index
   * @remarks Updates internal loading states map
   */
  onImageLoaded(index: number): void {
    const states = new Map(this.imageLoadingStates());
    states.set(index, false);
    this.imageLoadingStates.set(states);
  }

  /**
   * Preload image for smooth transitions
   * @param url - Image URL
   * @remarks Creates new Image object to trigger browser preload
   */
  private preloadImage(url: string): void {
    const img = new Image();
    img.src = url;
  }

  /**
   * Check if thumbnail is loading
   * @param attachmentId - Attachment ID
   * @returns Loading state boolean
   */
  isThumbnailLoading(attachmentId: string): boolean {
    return this.thumbnailLoadingStates().get(attachmentId) ?? true;
  }

  /**
   * Handle thumbnail load start
   * @param attachmentId - Attachment ID
   * @remarks Updates internal thumbnail loading states map
   */
  onThumbnailLoadStart(attachmentId: string): void {
    const states = new Map(this.thumbnailLoadingStates());
    states.set(attachmentId, true);
    this.thumbnailLoadingStates.set(states);
  }

  /**
   * Handle thumbnail load complete
   * @param attachmentId - Attachment ID
   * @remarks Updates internal thumbnail loading states map
   */
  onThumbnailLoaded(attachmentId: string): void {
    const states = new Map(this.thumbnailLoadingStates());
    states.set(attachmentId, false);
    this.thumbnailLoadingStates.set(states);
  }

  /**
   * Get preview URL for thumbnails
   * @param attachment - Task attachment
   * @returns Preview URL string
   * @remarks Uses getImageUrl method
   */
  getPreviewUrl(attachment: TaskAttachment): string {
    return this.getImageUrl(attachment);
  }

  /**
   * Get transform for current image (zoom, rotation, pan)
   * @returns CSS transform string
   * @remarks Combines zoom, rotation, and pan into single transform string
   */
  getImageTransform(): string {
    const zoom = this.zoomLevel();
    const rotate = this.rotation();
    const pan = this.panPosition();

    return `translate(${pan.x}px, ${pan.y}px) rotate(${rotate}deg) scale(${zoom})`;
  }

  /**
   * Navigate to next image
   * @remarks Loops to first image if at end
   */
  navigateNext(): void {
    const length = this.images().length;
    if (length === 0) return;
    this.previousIndex.set(this.currentIndex());
    this.animationDirection.set("next");
    this.currentIndex.update((i) => (i + 1) % length);
    this.resetImageState();
    this.announceCurrentImage();
    setTimeout(() => {
      this.animationDirection.set(null);
      this.previousIndex.set(null);
    }, 500);
  }

  /**
   * Navigate to previous image
   * @remarks Loops to last image if at start
   */
  navigatePrev(): void {
    const length = this.images().length;
    if (length === 0) return;
    this.previousIndex.set(this.currentIndex());
    this.animationDirection.set("prev");
    this.currentIndex.update((i) => (i - 1 + length) % length);
    this.resetImageState();
    this.announceCurrentImage();
    setTimeout(() => {
      this.animationDirection.set(null);
      this.previousIndex.set(null);
    }, 500);
  }

  /**
   * Jump to specific image by index
   * @param index - Image index to jump to
   * @remarks Updates current index and resets image state
   */
  jumpToImage(index: number): void {
    if (index < 0 || index >= this.images().length) return;
    if (index === this.currentIndex()) return;

    const direction = index > this.currentIndex() ? "next" : "prev";
    this.previousIndex.set(this.currentIndex());
    this.animationDirection.set(direction);
    this.currentIndex.set(index);
    this.resetImageState();
    this.announceCurrentImage();

    setTimeout(() => {
      this.animationDirection.set(null);
      this.previousIndex.set(null);
    }, 500);
  }

  /**
   * Announce current image to screen readers
   *  @remarks Uses LiveAnnouncer to announce image position and filename
   */
  private announceCurrentImage(): void {
    const img = this.currentImage();
    const message = `Image ${this.currentIndex() + 1} of ${this.images().length}: ${img.filename}`;
    this.liveAnnouncer.announce(message, "polite");
  }

  /**
   * Reset image state (zoom, rotation, pan)
   * @remarks Resets zoom level, rotation, pan position, and load error state
   */
  private resetImageState(): void {
    this.zoomLevel.set(1);
    this.rotation.set(0);
    this.panPosition.set({ x: 0, y: 0 });
    this.imageLoadError.set(false);
  }

  /**
   * Zoom in
   * @remarks Max zoom level of 4x
   */
  zoomIn(): void {
    this.zoomLevel.update((z) => Math.min(z + 0.25, 4));
  }

  /**
   * Zoom out
   * @remarks Min zoom level of 0.5x
   */
  zoomOut(): void {
    this.zoomLevel.update((z) => Math.max(z - 0.25, 0.5));
  }

  /**
   * Rotate image 90 degrees clockwise
   * @remarks Rotates image by 90 degrees clockwise
   */
  rotate90(): void {
    this.rotation.update((r) => (r + 90) % 360);
  }

  /**
   * Close viewer and emit close event
   * @remarks Resets image state before emitting close event
   */
  closeViewer(): void {
    this.resetImageState();
    this.close.emit();
  }

  /**
   * Handle keydown events for viewer controls
   * @returns {void}
   * @param event - The keyboard event triggered when a key is pressed.
   * @remarks
   * - Escape: Closes the viewer.
   * - ArrowLeft: Navigates to the previous image.
   */
  @HostListener("window:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case "Escape":
        this.closeViewer();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.navigatePrev();
        break;
      case "ArrowRight":
        event.preventDefault();
        this.navigateNext();
        break;
      case "+":
      case "=":
        this.zoomIn();
        break;
      case "-":
        this.zoomOut();
        break;
      case "r":
      case "R":
        this.rotate90();
        break;
    }
  }

  /**
   *  Handles the touch start event for the image viewer component.
   * @returns {void}
   * @param event - The touch event triggered when the user places their finger on the screen.
   * @remarks
   * - Records the starting touch position for potential panning or swipe navigation.
   */
  @HostListener("touchstart", ["$event"])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartXSignal.set(event.touches[0].clientX);
      this.touchStartYSignal.set(event.touches[0].clientY);
    } else if (event.touches.length === 2 && this.zoomLevel() > 1) {
      this.isPanning.set(true);
    }
  }

  /**
   * Handles the touch move event for the image viewer component.
   * @returns {void}
   * @param event - The touch event triggered when the user moves their finger on the screen.
   */
  @HostListener("touchmove", ["$event"])
  onTouchMove(event: TouchEvent): void {
    if (this.isPanning() && event.touches.length === 2) {
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartXSignal();
      const deltaY = touch.clientY - this.touchStartYSignal();

      this.panPosition.update((pos) => ({
        x: pos.x + deltaX,
        y: pos.y + deltaY,
      }));

      this.touchStartXSignal.set(touch.clientX);
      this.touchStartYSignal.set(touch.clientY);
    }
  }

  @HostListener("touchend", ["$event"])
  /**
   * Handles the touch end event for the image viewer component.
   * @returns {void}
   * @param event - The touch event triggered when the user lifts their finger.
   */
  onTouchEnd(event: TouchEvent): void {
    this.isPanning.set(false);

    if (event.changedTouches.length === 0) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.touchStartXSignal();
    const deltaY = touchEndY - this.touchStartYSignal();

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.navigatePrev();
      } else {
        this.navigateNext();
      }
    }
  }

  /**
   * Toggle action popup for download options
   * @param event - Mouse event
   * @remarks Positions popup near button and toggles visibility
   */
  toggleActionPopup(event: MouseEvent): void {
    event.stopPropagation();

    if (this.showActionPopup()) {
      this.showActionPopup.set(false);
      return;
    }

    this.actionPopupPosition.set({
      x: 80,
      y: 100,
    });

    this.showActionPopup.set(true);
  }

  /**
   * Download single image
   * @remarks Uses AttachmentStorageService to download current image
   */
  async onDownloadSingle(): Promise<void> {
    this.showActionPopup.set(false);
    this.isDownloading.set(true);
    try {
      await this.attachmentStorageService.downloadSingleAttachment(
        this.currentImage(),
      );
    } finally {
      this.isDownloading.set(false);
    }
  }

  /**
   * Download all images as ZIP
   * @remarks Uses AttachmentStorageService to download all images as a ZIP file, passing the current task title for naming the ZIP file appropriately.
   */
  async onDownloadAll(): Promise<void> {
    this.showActionPopup.set(false);
    this.isDownloading.set(true);
    try {
      await this.attachmentStorageService.downloadAllAsZip(
        this.images(),
        this.taskTitle(),
      );
    } finally {
      this.isDownloading.set(false);
    }
  }

  /**
   * Handle image load error
   * @remarks Sets error state and shows toast notification on image load failure
   */
  onImageError(event: Event): void {
    this.imageLoadError.set(true);
    this.toastService.showError("Failed to load image");
  }
}
