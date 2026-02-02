import { Directive, HostListener } from '@angular/core';

/**
 * Directive to prevent default event behavior
 * Usage: <form (submit)="handler()" preventDefault>
 * 
 * This is commonly used for forms, drag & drop, etc.
 */
@Directive({
  selector: '[preventDefault]',
  standalone: true
})
export class PreventDefaultDirective {
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
  }

  @HostListener('submit', ['$event'])
  onSubmit(event: Event): void {
    event.preventDefault();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
  }
}
