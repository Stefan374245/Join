import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [FormsModule, CommonModule, ToastComponent, ClickOutsideDirective],
  templateUrl: './subtask-list.component.html',
  styleUrls: ['./subtask-list.component.scss']
})
export class SubtaskListComponent {
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  @Input() subtasks: any[] = [];
  @Input() editingSubtaskId: string | null = null;
  @Input() subtaskEditInput: string = '';
  @Output() editSubtask = new EventEmitter<any>();
  @Output() deleteSubtask = new EventEmitter<string>();
  @Output() updateSubtask = new EventEmitter<void>();
  @Output() cancelEditSubtask = new EventEmitter<void>();
  @Output() maxSubtasksReached = new EventEmitter<void>();
  @Output() addSubtask = new EventEmitter<string>();

  isDropdownOpen = false;
  readonly MAX_SUBTASKS = 5;

  constructor(private toastService: ToastService) {}

  get visibleSubtasks(): any[] {
    if (this.subtasks.length <= 2) {
      return this.subtasks;
    }
    return this.subtasks.slice(0, 2);
  }

  get remainingSubtasks(): any[] {
    return this.subtasks.slice(2);
  }

  get remainingSubtasksCount(): number {
    return Math.max(0, this.subtasks.length - 2);
  }

  onAddSubtask(input: string): void {
    if (!input.trim()) {
      return;
    }

    if (this.subtasks.length >= this.MAX_SUBTASKS) {
      this.toastService.showToast('Maximal 5 Subtasks erlaubt');
      return;
    }

    this.addSubtask.emit(input.trim());
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  onEdit(subtask: any) {
    this.editSubtask.emit(subtask);
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
      }
    }, 0);
  }
  onDelete(id: string) {
    this.deleteSubtask.emit(id);
  }
  onUpdate() {
    this.updateSubtask.emit();
  }
  onCancelEdit() {
    this.cancelEditSubtask.emit();
  }

  onInputBlur(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget ||
        (!relatedTarget.classList.contains('subtask-edit-icon') &&
         !relatedTarget.classList.contains('subtask-action-icon'))) {
      this.cancelEditSubtask.emit();
    }
  }
}
