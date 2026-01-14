import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, signal, computed, input, model, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [FormsModule, CommonModule, ToastComponent, ClickOutsideDirective],
  templateUrl: './subtask-list.component.html',
  styleUrls: ['./subtask-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubtaskListComponent {
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  subtasks = input<any[]>([]);
  editingSubtaskId = input<string | null>(null);
  subtaskEditInput = input<string>('');
  @Output() editSubtask = new EventEmitter<any>();
  @Output() deleteSubtask = new EventEmitter<string>();
  @Output() updateSubtask = new EventEmitter<void>();
  @Output() cancelEditSubtask = new EventEmitter<void>();
  @Output() maxSubtasksReached = new EventEmitter<void>();
  @Output() addSubtask = new EventEmitter<string>();
  @Output() subtaskEditInputChange = new EventEmitter<string>();

  isDropdownOpen = signal(false);
  editInputValue = signal('');
  readonly MAX_SUBTASKS = 5;

  constructor(private toastService: ToastService) {
    effect(() => {
      this.editInputValue.set(this.subtaskEditInput());
    });
  }

  visibleSubtasks = computed(() => {
    const tasks = this.subtasks();
    if (tasks.length <= 2) {
      return tasks;
    }
    return tasks.slice(0, 2);
  });

  remainingSubtasks = computed(() => {
    return this.subtasks().slice(2);
  });

  remainingSubtasksCount = computed(() => {
    return Math.max(0, this.subtasks().length - 2);
  });

  canAddMore = computed(() => this.subtasks().length < this.MAX_SUBTASKS);

  onAddSubtask(input: string): void {
    if (!input.trim()) {
      return;
    }

    if (!this.canAddMore()) {
      this.toastService.showToast('Maximal 5 Subtasks erlaubt');
      return;
    }

    this.addSubtask.emit(input.trim());
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
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
