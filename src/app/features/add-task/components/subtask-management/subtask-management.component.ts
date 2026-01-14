import { Component, ViewChild, ElementRef, signal, computed, input, output, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';

/**
 * Subtask Interface
 */
export interface Subtask {
    id: string;
    title: string;
    completed?: boolean;
}

/**
 * Subtask Management Component
 * 
 * Domain-specific component for managing subtasks in AddTask form.
 * Combines subtask input field with subtask list display and editing.
 * 
 * @example
 * ```html
 * <app-subtask-management
 *   [subtasks]="subtasks()"
 *   (addSubtask)="onAddSubtask($event)"
 *   (editSubtask)="onEditSubtask($event)"
 *   (updateSubtask)="onUpdateSubtask()"
 *   (deleteSubtask)="onDeleteSubtask($event)"
 * />
 * ```
 * 
 * @features
 * - Add new subtasks with input field
 * - Display up to 5 subtasks (max limit)
 * - Edit existing subtasks inline
 * - Delete subtasks
 * - Collapsible dropdown for more than 2 subtasks
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 */
@Component({
    selector: 'app-subtask-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastComponent, ClickOutsideDirective],
    templateUrl: './subtask-management.component.html',
    styleUrl: './subtask-management.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubtaskManagementComponent {
    @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;
    @ViewChild('addInput') addInput!: ElementRef<HTMLInputElement>;

    subtasks = input<Subtask[]>([]);
    
    editingSubtaskId = input<string | null>(null);
    
    subtaskEditInput = input<string>('');

    addSubtask = output<string>();
    
    editSubtask = output<Subtask>();
    
    updateSubtask = output<void>();
    
    cancelEditSubtask = output<void>();
    
    deleteSubtask = output<string>();
    
    subtaskEditInputChange = output<string>();

    subtaskInputControl = signal<FormControl>(new FormControl(''));
    
    isDropdownOpen = signal(false);
    
    editInputValue = signal('');
    
    inputFocused = signal(false);
    
    readonly MAX_SUBTASKS = 5;

    /**
     * First 2 subtasks (always visible)
     */
    visibleSubtasks = computed(() => {
        const tasks = this.subtasks();
        if (tasks.length <= 2) {
            return tasks;
        }
        return tasks.slice(0, 2);
    });

    /**
     * Remaining subtasks (hidden in dropdown)
     */
    remainingSubtasks = computed(() => {
        return this.subtasks().slice(2);
    });

    /**
     * Count of remaining subtasks
     */
    remainingSubtasksCount = computed(() => {
        return Math.max(0, this.subtasks().length - 2);
    });

    /**
     * Whether more subtasks can be added
     */
    canAddMore = computed(() => this.subtasks().length < this.MAX_SUBTASKS);
    
    /**
     * Placeholder text for input field
     */
    inputPlaceholder = computed(() => {
        const count = this.subtasks().length;
        if (count === 0) return 'Add new subtask';
        if (count >= this.MAX_SUBTASKS) return `Maximum ${this.MAX_SUBTASKS} subtasks reached`;
        return 'Add another subtask';
    });
    
    /**
     * Whether input field is currently focused
     */
    isInputFocused = computed(() => this.inputFocused());

    constructor(private toastService: ToastService) {
        effect(() => {
            this.editInputValue.set(this.subtaskEditInput());
        });
    }

    /**
     * Handle add subtask button click
     */
    onAddSubtask(): void {
        const input = this.subtaskInputControl().value?.trim();
        
        if (!input) {
            return;
        }

        if (!this.canAddMore()) {
            this.toastService.showToast('Maximal 5 Subtasks erlaubt');
            return;
        }

        this.addSubtask.emit(input);
        this.subtaskInputControl().reset();
        
        setTimeout(() => {
            if (this.addInput) {
                this.addInput.nativeElement.focus();
            }
        }, 0);
    }

    /**
     * Handle Enter key in add input
     */
    onAddInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onAddSubtask();
        }
    }
    
    /**
     * Handle input focus
     */
    onAddInputFocus(): void {
        console.log('Input focused!');
        this.inputFocused.set(true);
    }
    
    /**
     * Handle input blur
     */
    onAddInputBlur(): void {
        console.log('Input blurred!');
        setTimeout(() => {
            this.inputFocused.set(false);
        }, 150);
    }
    
    /**
     * Clear input field
     */
    onClearInput(): void {
        this.subtaskInputControl().reset();
        if (this.addInput) {
            this.addInput.nativeElement.focus();
        }
    }

    /**
     * Start editing a subtask
     */
    onEdit(subtask: Subtask): void {
        this.editSubtask.emit(subtask);
        setTimeout(() => {
            if (this.editInput) {
                this.editInput.nativeElement.focus();
            }
        }, 0);
    }

    /**
     * Update edited subtask
     */
    onUpdate(): void {
        this.updateSubtask.emit();
    }

    /**
     * Cancel editing
     */
    onCancelEdit(): void {
        this.cancelEditSubtask.emit();
    }

    /**
     * Handle input blur during editing
     */
    onInputBlur(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (!relatedTarget ||
                (!relatedTarget.classList.contains('subtask-edit-icon') &&
                 !relatedTarget.classList.contains('subtask-action-icon'))) {
            this.cancelEditSubtask.emit();
        }
    }

    /**
     * Delete a subtask
     */
    onDelete(id: string): void {
        this.deleteSubtask.emit(id);
    }

    /**
     * Toggle dropdown for remaining subtasks
     */
    toggleDropdown(): void {
        this.isDropdownOpen.update(open => !open);
    }

    /**
     * Close dropdown
     */
    closeDropdown(): void {
        this.isDropdownOpen.set(false);
    }
}
