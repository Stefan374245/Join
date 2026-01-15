import { Component, ViewChild, ElementRef, signal, computed, input, output, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';

/**
 * Subtask data interface
 */
export interface Subtask {
    id: string;
    title: string;
    completed?: boolean;
}

/**
 * Subtask management component with add, edit, delete and overflow handling
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
     * First 2 subtasks that are always visible
     */
    visibleSubtasks = computed(() => {
        const tasks = this.subtasks();
        if (tasks.length <= 2) {
            return tasks;
        }
        return tasks.slice(0, 2);
    });

    /**
     * Subtasks hidden in dropdown after first 2
     */
    remainingSubtasks = computed(() => {
        return this.subtasks().slice(2);
    });

    /**
     * Count of hidden subtasks for display
     */
    remainingSubtasksCount = computed(() => {
        return Math.max(0, this.subtasks().length - 2);
    });

    /**
     * Whether more subtasks can be added (max 5)
     */
    canAddMore = computed(() => this.subtasks().length < this.MAX_SUBTASKS);
    
    /**
     * Dynamic placeholder text based on current state
     */
    inputPlaceholder = computed(() => {
        const count = this.subtasks().length;
        if (count === 0) return 'Add new subtask';
        if (count >= this.MAX_SUBTASKS) return `Maximum ${this.MAX_SUBTASKS} subtasks reached`;
        return 'Add another subtask';
    });
    
    /**
     * Input focus state for UI styling
     */
    isInputFocused = computed(() => this.inputFocused());

    constructor(private toastService: ToastService) {
        effect(() => {
            this.editInputValue.set(this.subtaskEditInput());
        });
    }

    /**
     * Handles adding new subtask with validation
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
     * Handles Enter key press in add input field
     * @param event - Keyboard event
     */
    onAddInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onAddSubtask();
        }
    }
    
    /**
     * Handles input field focus event
     */
    onAddInputFocus(): void {
        console.log('Input focused!');
        this.inputFocused.set(true);
    }
    
    /**
     * Handles input field blur event with delay
     */
    onAddInputBlur(): void {
        console.log('Input blurred!');
        setTimeout(() => {
            this.inputFocused.set(false);
        }, 150);
    }
    
    /**
     * Clears input field and refocuses
     */
    onClearInput(): void {
        this.subtaskInputControl().reset();
        if (this.addInput) {
            this.addInput.nativeElement.focus();
        }
    }

    /**
     * Initiates subtask editing mode
     * @param subtask - Subtask to edit
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
     * Confirms subtask update
     */
    onUpdate(): void {
        this.updateSubtask.emit();
    }

    /**
     * Cancels subtask editing
     */
    onCancelEdit(): void {
        this.cancelEditSubtask.emit();
    }

    /**
     * Handles input blur during editing with focus check
     * @param event - Focus event
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
     * Deletes specified subtask
     * @param id - Subtask ID to delete
     */
    onDelete(id: string): void {
        this.deleteSubtask.emit(id);
    }

    /**
     * Toggles dropdown visibility for overflow subtasks
     */
    toggleDropdown(): void {
        this.isDropdownOpen.update(open => !open);
    }

    /**
     * Closes subtask overflow dropdown
     */
    closeDropdown(): void {
        this.isDropdownOpen.set(false);
    }
}
