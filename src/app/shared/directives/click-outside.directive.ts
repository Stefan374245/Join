import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    this.handleClickOutside(event);
  }

  @HostListener('document:mousedown', ['$event'])
  public onMouseDown(event: MouseEvent): void {
    this.handleClickOutside(event);
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }
    
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
