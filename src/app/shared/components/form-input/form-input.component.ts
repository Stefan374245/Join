import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';

export type FormInputType = 'text' | 'email' | 'tel' | 'password';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-input.component.html',
  styleUrl: './form-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInputComponent {
  id = input.required<string>();
  label = input.required<string>();
  control = input.required<FormControl>();

  type = input<FormInputType>('text');
  placeholder = input<string>('');
  icon = input<string>('');
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  labelVisible = input<boolean>(false);

  /**
   * Signal that triggers recomputation when FormControl state changes
   */
  private updateTrigger = signal(0);

  /**
   * Determines if field has validation errors
   * @returns {boolean} True if field is touched and invalid, otherwise false
   * @remarks Depends on updateTrigger to recompute when control state changes
   */
  hasError = computed(() => {
    this.updateTrigger();
    const ctrl = this.control();
    return ctrl.touched && ctrl.invalid;
  });

  /**
   * Gets current validation errors
   * @returns {ValidationErrors | null} Current validation errors or null if none
   * @remarks Depends on updateTrigger to recompute when control state changes
   */
  validationErrors = computed((): ValidationErrors | null => {
    this.updateTrigger();
    const ctrl = this.control();
    if (ctrl.touched && ctrl.errors) {
      return ctrl.errors;
    }
    return null;
  });

  /**
   * Generates appropriate error message for display
   * @returns {string} User-friendly error message based on validation errors
   * @remarks Checks for common validation error types and returns corresponding messages
   */
  displayErrorMessage = computed(() => {
    const errors = this.validationErrors();
    if (!errors) return '';

    if (errors['serverError']) return errors['serverError'];
    if (errors['required']) return `${this.label()} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) {
      return `Minimum ${errors['minlength'].requiredLength} characters required`;
    }
    if (errors['maxlength']) {
      return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    }
    if (errors['pattern']) return 'Invalid format';
    if (errors['hasSpaces']) return 'Password must not contain spaces';

    return 'Invalid input';
  });

  /**
   * Generates ARIA describedby attribute value
   * @returns {string | null} ARIA describedby attribute value or null if no error
   */
  ariaDescribedby = computed(() => {
    const inputId = this.id();
    if (this.hasError()) {
      return `${inputId}-error`;
    }
    return null;
  });

  /**
   * Dynamic input CSS classes
   * @returns {object} Object with CSS class names as keys and boolean values indicating whether the class should be applied
   * @remarks Applies 'form-input' class by default, adds 'has-icon' if icon is provided, 'error' if field has validation errors, and 'readonly' if field is read-only
   */
  inputClasses = computed(() => ({
    'form-input': true,
    'has-icon': !!this.icon(),
    'error': this.hasError(),
    'readonly': this.readonly()
  }));

  /**
   * Triggers update when input loses focus
   * @returns {void}
   * @remarks Marks control as touched and triggers recomputation of error state and messages
   */
  onInputBlur(): void {
    this.control().markAsTouched();
    this.updateTrigger.set(Date.now());
  }
}
