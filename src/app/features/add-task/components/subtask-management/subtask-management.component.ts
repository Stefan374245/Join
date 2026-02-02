import { Component, ViewChild, ElementRef, signal, computed, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ClickOutsideDirective, StopPropagationDirective, PreventDefaultDirective } from '../../../../shared/directives';
export interface Subtask {
    id: string;
    title: string;
    completed?: boolean;
}

@Component({
    selector: 'app-subtask-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastComponent, ClickOutsideDirective, StopPropagationDirective, PreventDefaultDirective],
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

    private toastService = inject(ToastService);

    subtaskInputControl = signal<FormControl>(new FormControl(''));
    isDropdownOpen = signal(false);
    editInputValue = signal('');
    inputFocused = signal(false);
    
    readonly MAX_SUBTASKS = 5;

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
  
    inputPlaceholder = computed(() => {
        const count = this.subtasks().length;
        if (count === 0) return 'Add new subtask';
        if (count >= this.MAX_SUBTASKS) return `Maximum ${this.MAX_SUBTASKS} subtasks reached`;
        return 'Add another subtask';
    });
    
    isInputFocused = computed(() => this.inputFocused());

    constructor() {
        effect(() => {
            this.editInputValue.set(this.subtaskEditInput());
        });
    }

   
    /**
     * Handles the addition of a new subtask.
     *
     * - Retrieves and trims the input value from the subtask input control.
     * - If the input is empty, the method returns early.
     * - Checks if the maximum number of subtasks (5) has been reached; if so, displays a toast notification and returns.
     * - Emits the new subtask input to the parent component for further handling.
     * - Resets the subtask input control and refocuses the input field.
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

        // Always emit to parent - parent decides TaskService vs local handling
        this.addSubtask.emit(input);
        this.subtaskInputControl().reset();
        this.focusAddInput();
    }

  
    /**
     * Sets focus to the add input element after the current call stack is cleared.
     * Uses `setTimeout` with a delay of 0 to ensure the DOM is updated before focusing.
     * Checks if `addInput` is defined before attempting to focus.
     *
     * @private
     */
    private focusAddInput(): void {
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
    
   
    onAddInputFocus(): void {
        console.log('Input focused!');
        this.inputFocused.set(true);
    }
    

    /**
     * Handles the blur event on the input field.
     * Logs a message to the console and, after a short delay,
     * sets the `inputFocused` state to false.
     * The delay ensures that any related events (such as click)
     * are processed before the focus state changes.
     */
    onAddInputBlur(): void {
        console.log('Input blurred!');
        setTimeout(() => {
            this.inputFocused.set(false);
        }, 150);
    }
    
    
    /**
     * Clears the value of the subtask input control and resets its state.
     * If the input element reference (`addInput`) exists, it sets focus back to the input field.
     *
     * @remarks
     * This method is typically used to clear user input and prepare the input field for new data entry.
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
     * Emits an event to notify that a subtask update action has been triggered.
     *
     * This method should be called when the user initiates an update operation
     * for a subtask. It emits the `updateSubtask` event to inform parent components
     * or services that the update process should proceed.
     */
    onUpdate(): void {
        this.updateSubtask.emit();
    }


    /**
     * Emits an event to notify that the subtask edit operation has been cancelled.
     * Typically used to revert the UI to its previous state or close an edit form.
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
     * Deletes specified subtask - emits to parent for TaskService handling
     * @param id - Subtask ID to delete
     */
    onDelete(id: string): void {
        this.deleteSubtask.emit(id);
    }

  
    /**
     * Toggles the open state of the dropdown menu.
     * 
     * This method updates the `isDropdownOpen` state by inverting its current value.
     * Typically used to show or hide a dropdown in the UI.
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
