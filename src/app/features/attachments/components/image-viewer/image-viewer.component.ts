import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, inject, HostListener,} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { StopPropagationDirective } from "../../../../shared/directives";
import { ToastService } from "../../../../core/services/toast.service";
import { AttachmentStorageService } from "../../services/attachment-storage.service";
import { TaskAttachment } from "../../../../core/models/task.interface";
import { formatFileSize } from "../../../../shared/utils";
import { calculateBase64Size } from "../../../../shared/constants";
import { LoadingSpinnerComponent } from "../../../../shared/components/loading-spinner/loading-spinner.component";
import * as LoadingHelper from './image-viewer-loading.helper';
import * as NavigationHelper from './image-viewer-navigation.helper';
import * as GesturesHelper from './image-viewer-gestures.helper';
import * as TransformHelper from './image-viewer-transform.helper';

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
    return images.map((att) => TransformHelper.getAttachmentImageUrl(att));
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

  formatFileSize = formatFileSize;

  /**
   * Gets the correct file size for an attachment, always calculated from base64
   * @param attachment - The task attachment
   * @returns {number} - The actual size in bytes based on the compressed base64 data
   * @remarks This method ensures that the displayed size is always correct by calculating it from the base64 string.
   */
  getAttachmentSize(attachment: TaskAttachment): number {
    return calculateBase64Size(attachment.base64);
  }

  /**
   * Component constructor
   * @remarks Sets up reactive effects for initial index and image preloading, and event listeners for window resize and body scroll lock
   */
  constructor() {
    effect(() => {
      const images = this.images();
      if (!images || images.length === 0) return;
      const initial = this.initialIndex();
      const length = images.length;
      if (initial >= 0 && initial < length) {
        this.currentIndex.set(initial);
      }
    });

    effect(() => {
      const images = this.images();
      if (!images || images.length === 0) return;
      const indices = this.renderedIndices();
      const urls = this.imageUrls();
      indices.forEach((idx) => {
        const url = urls[idx];
        if (url) LoadingHelper.preloadImage(url);
      });
    });

    const resizeHandler = () => this.windowWidthSignal.set(window.innerWidth);
    window.addEventListener("resize", resizeHandler);
    effect((onCleanup) => {
      onCleanup(() => window.removeEventListener("resize", resizeHandler));
    });

    effect(() => {
      if (this.images().length > 0) {
        document.body.style.overflow = "hidden";
      }
      return () => { document.body.style.overflow = ""; };
    });
  }

  private getImageUrl(attachment: TaskAttachment): string {
    return TransformHelper.getAttachmentImageUrl(attachment);
  }

  isImageLoading(index: number): boolean {
    return LoadingHelper.isImageLoading(this.imageLoadingStates(), index);
  }

  onImageLoadStart(index: number): void {
    const newStates = LoadingHelper.updateImageLoadingState(this.imageLoadingStates(), index, true);
    this.imageLoadingStates.set(newStates);
  }

  onImageLoaded(index: number): void {
    const newStates = LoadingHelper.updateImageLoadingState(this.imageLoadingStates(), index, false);
    this.imageLoadingStates.set(newStates);
  }

  isThumbnailLoading(attachmentId: string): boolean {
    return LoadingHelper.isThumbnailLoading(this.thumbnailLoadingStates(), attachmentId);
  }

  onThumbnailLoadStart(attachmentId: string): void {
    const newStates = LoadingHelper.updateThumbnailLoadingState(this.thumbnailLoadingStates(), attachmentId, true);
    this.thumbnailLoadingStates.set(newStates);
  }

  onThumbnailLoaded(attachmentId: string): void {
    const newStates = LoadingHelper.updateThumbnailLoadingState(this.thumbnailLoadingStates(), attachmentId, false);
    this.thumbnailLoadingStates.set(newStates);
  }

  getPreviewUrl(attachment: TaskAttachment): string {
    return this.getImageUrl(attachment);
  }

  getImageTransform(): string {
    return TransformHelper.getImageTransform({
      zoom: this.zoomLevel(),
      rotation: this.rotation(),
      pan: this.panPosition()
    });
  }

  navigateNext(): void {
    const navState = NavigationHelper.navigateToNext(
      this.currentIndex(),
      this.images().length,
      () => this.resetImageState(),
      () => this.announceCurrentImage()
    );
    this.previousIndex.set(navState.previousIndex);
    this.animationDirection.set(navState.animationDirection);
    this.currentIndex.set(navState.currentIndex);
    NavigationHelper.clearAnimationState(
      (dir) => this.animationDirection.set(dir),
      (idx) => this.previousIndex.set(idx)
    );
  }

  navigatePrev(): void {
    const navState = NavigationHelper.navigateToPrevious(
      this.currentIndex(),
      this.images().length,
      () => this.resetImageState(),
      () => this.announceCurrentImage()
    );
    this.previousIndex.set(navState.previousIndex);
    this.animationDirection.set(navState.animationDirection);
    this.currentIndex.set(navState.currentIndex);
    NavigationHelper.clearAnimationState(
      (dir) => this.animationDirection.set(dir),
      (idx) => this.previousIndex.set(idx)
    );
  }

  jumpToImage(index: number): void {
    const navState = NavigationHelper.jumpToSpecificImage(
      this.currentIndex(),
      index,
      this.images().length,
      () => this.resetImageState(),
      () => this.announceCurrentImage()
    );
    if (!navState) return;
    this.previousIndex.set(navState.previousIndex);
    this.animationDirection.set(navState.animationDirection);
    this.currentIndex.set(navState.currentIndex);
    NavigationHelper.clearAnimationState(
      (dir) => this.animationDirection.set(dir),
      (idx) => this.previousIndex.set(idx)
    );
  }

  private announceCurrentImage(): void {
    const img = this.currentImage();
    const message = `Image ${this.currentIndex() + 1} of ${this.images().length}: ${img.filename}`;
    this.liveAnnouncer.announce(message, "polite");
  }

  private resetImageState(): void {
    const initialState = TransformHelper.createInitialTransformState();
    this.zoomLevel.set(initialState.zoom);
    this.rotation.set(initialState.rotation);
    this.panPosition.set(initialState.pan);
    this.imageLoadError.set(false);
  }

  zoomIn(): void {
    this.zoomLevel.update((z) => TransformHelper.calculateZoomIn(z));
  }

  zoomOut(): void {
    this.zoomLevel.update((z) => TransformHelper.calculateZoomOut(z));
  }

  rotate90(): void {
    this.rotation.update((r) => TransformHelper.calculateRotation90(r));
  }

  closeViewer(): void {
    this.resetImageState();
    this.close.emit();
  }

  @HostListener("window:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case "Escape": this.closeViewer(); break;
      case "ArrowLeft": event.preventDefault(); this.navigatePrev(); break;
      case "ArrowRight": event.preventDefault(); this.navigateNext(); break;
      case "+":
      case "=": this.zoomIn(); break;
      case "-": this.zoomOut(); break;
      case "r":
      case "R": this.rotate90(); break;
    }
  }

  @HostListener("touchstart", ["$event"])
  onTouchStart(event: TouchEvent): void {
    const result = GesturesHelper.handleTouchStart(event, this.zoomLevel());
    if (!result) return;
    this.touchStartXSignal.set(result.touchState.startX);
    this.touchStartYSignal.set(result.touchState.startY);
    this.isPanning.set(result.isPanning);
  }

  @HostListener("touchmove", ["$event"])
  onTouchMove(event: TouchEvent): void {
    const result = GesturesHelper.handleTouchMove(
      event,
      this.isPanning(),
      this.touchStartXSignal(),
      this.touchStartYSignal(),
      this.panPosition()
    );
    if (!result) return;
    if (result.shouldPreventDefault) event.preventDefault();
    this.panPosition.set(result.newPan);
    this.touchStartXSignal.set(result.newTouchState.startX);
    this.touchStartYSignal.set(result.newTouchState.startY);
  }

  @HostListener("touchend", ["$event"])
  onTouchEnd(event: TouchEvent): void {
    this.isPanning.set(false);
    const swipeDirection = GesturesHelper.handleTouchEnd(
      event,
      this.touchStartXSignal(),
      this.touchStartYSignal()
    );
    if (swipeDirection === 'prev') this.navigatePrev();
    else if (swipeDirection === 'next') this.navigateNext();
  }

  toggleActionPopup(event: MouseEvent): void {
    event.stopPropagation();
    if (this.showActionPopup()) {
      this.showActionPopup.set(false);
      return;
    }
    this.actionPopupPosition.set({ x: 80, y: 100 });
    this.showActionPopup.set(true);
  }

  async onDownloadSingle(): Promise<void> {
    this.showActionPopup.set(false);
    this.isDownloading.set(true);
    try {
      await this.attachmentStorageService.downloadSingleAttachment(this.currentImage());
    } finally {
      this.isDownloading.set(false);
    }
  }

  async onDownloadAll(): Promise<void> {
    this.showActionPopup.set(false);
    this.isDownloading.set(true);
    try {
      await this.attachmentStorageService.downloadAllAsZip(this.images(), this.taskTitle());
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
