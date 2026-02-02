import { Directive, HostListener } from '@angular/core';

/**
 * Directive to stop event propagation
 * Usage: <div (click)="handler()" stopPropagation>
 * 
 * This prevents the event from bubbling up to parent elements
 */
@Directive({
  selector: '[stopPropagation]',
  standalone: true
})
export class StopPropagationDirective {
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    event.stopPropagation();
  }
}
