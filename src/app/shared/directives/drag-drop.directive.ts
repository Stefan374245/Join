import { Directive, ElementRef, HostListener, input, output } from '@angular/core';

/**
 * Directive for drag and drop file handling
 * Usage: 
 * <div dragDrop (filesDropped)="handleFiles($event)">
 *   Drop files here
 * </div>
 */
@Directive({
  selector: '[dragDrop]',
  standalone: true
})
export class DragDropDirective {
  allowedTypes = input<string[]>(['image/jpeg', 'image/png']);
  maxFiles = input<number>(5);
  
  filesDropped = output<File[]>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.elementRef.nativeElement.classList.add('drag-over');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.elementRef.nativeElement.classList.remove('drag-over');
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.elementRef.nativeElement.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      this.filesDropped.emit(fileArray);
    }
  }
}
