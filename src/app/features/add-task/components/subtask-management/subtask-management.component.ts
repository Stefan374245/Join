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
     * @param subtask - The title of the new subtask to be added.
     * @return {void}
     * @remarks This method first checks if the input for the new subtask is valid (not empty). If the input is valid, it then checks if the maximum number of subtasks has been reached. If the user can add more subtasks, it emits the `addSubtask` event with the new subtask title, resets the input control, and sets focus back to the input field. If the maximum number of subtasks has been reached, it shows a toast notification to inform the user.
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
        this.focusAddInput();
    }

  
    /**
     * Sets focus to the add input element after the current call stack is cleared.
        * @return {void}
        * @remarks This method uses `setTimeout` with a delay of 0 to ensure that the focus is set to the add input element after any pending operations in the current call stack have been completed. This is particularly useful when adding a new subtask, as it allows the UI to update before attempting to focus the input field, ensuring a smoother user experience.
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
     * @return {void}
     * @remarks This method listens for the 'Enter' key press event on the add input field. When the 'Enter' key is pressed, it prevents the default behavior (which would typically submit a form) and calls the `onAddSubtask` method to add the new subtask. This allows users to quickly add subtasks by simply typing the title and pressing 'Enter', enhancing the usability of the subtask management interface.
     */
    onAddInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onAddSubtask();
        }
    }
    
   
    onAddInputFocus(): void {
        this.inputFocused.set(true);
    }
    

    /**
     * Handles the blur event on the input field.
     * @return {void}
     * @remarks This method is called when the input field loses focus. It uses `setTimeout` to delay the execution of setting the `inputFocused` signal to `false`, allowing any related click events (such as clicking on a dropdown or action button) to be processed before the input is marked as unfocused. This helps prevent issues where the input might lose focus prematurely when interacting with other UI elements related to the subtask management.
     */
    onAddInputBlur(): void {
        setTimeout(() => {
            this.inputFocused.set(false);
        }, 150);
    }
    
    
    /**
     * Clears the value of the subtask input control and resets its state.
     * @return {void}
     * @remarks This method resets the subtask input control to an empty state and then sets focus back to the input field. This is typically used after a subtask has been successfully added, allowing the user to quickly add another subtask without having to manually clear the input field or click on it again.
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
     * @return {void}
     * @remarks This method is called when the user clicks the edit icon for a subtask. It emits the `editSubtask` event with the subtask to be edited, which allows parent components or services to handle the editing logic. After emitting the event, it sets focus to the edit input field to allow the user to immediately start editing the subtask title.
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
     * @return {void}
     * @remarks This method is typically called when the user finishes editing a subtask and wants to save the changes. It emits the `updateSubtask` event, which can be handled by parent components or services to perform the actual update logic, such as saving the changes to a database or updating the UI accordingly.
     */
    onUpdate(): void {
        this.updateSubtask.emit();
    }


    /**
     * Emits an event to notify that the subtask edit operation has been cancelled.
     * @return {void}
     * @remarks This method is typically called when the user cancels editing a subtask. It emits the `cancelEditSubtask` event, which can be handled by parent components or services to revert the UI to its previous state or close the edit form.
     */
    onCancelEdit(): void {
        this.cancelEditSubtask.emit();
    }

    /**
     * Handles input blur during editing with focus check
     *@param event - Focus event triggered when the edit input field loses focus
     * @return {void}
     * @remarks This method is called when the edit input field loses focus. It checks the related target of the blur event to determine if the focus is moving to an element that should keep the edit mode active (such as action icons). If the focus is moving to an unrelated element, it emits the `cancelEditSubtask` event to exit the edit mode. This ensures that users can interact with related UI elements without unintentionally cancelling their edits.
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
     * @return {void}
     * @remarks This method is called when the user clicks the delete icon for a subtask. It emits the `deleteSubtask` event with the ID of the subtask to be deleted, allowing parent components or services to handle the deletion logic, such as removing the subtask from a database or updating the UI accordingly.
     */
    onDelete(id: string): void {
        this.deleteSubtask.emit(id);
    }

  
    /**
     * Toggles the open state of the dropdown menu.
     * @return {void}
     * @remarks This method updates the `isDropdownOpen` signal to toggle the visibility of the dropdown menu. When called, it inverts the current state of `isDropdownOpen`, allowing the dropdown to open if it was closed, or close if it was open. This is typically used in response to user interactions, such as clicking on a dropdown toggle button.
     */
    toggleDropdown(): void {
        this.isDropdownOpen.update(open => !open);
    }

    /**
     * Closes subtask overflow dropdown
     *  @return {void}
     * @remarks This method sets the `isDropdownOpen` signal to `false`, which closes the dropdown menu. It is typically called when the user clicks outside of the dropdown or performs an action that should close the dropdown, ensuring that the UI behaves as expected and does not leave the dropdown open unintentionally.
     */
    closeDropdown(): void {
        this.isDropdownOpen.set(false);
    }
}
