import { 
    Component, 
    ChangeDetectionStrategy, 
    input, 
    computed,
    effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';

/**
 * Supported form field input types
 */
export type FormFieldType = 'text' | 'email' | 'number' | 'date' | 'textarea';

/**
 * Reusable form field component with validation and accessibility support
 */
@Component({
    selector: 'app-form-field',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-field.component.html',
    styleUrl: './form-field.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
    /** Unique identifier for the form field */
    id = input.required<string>();
    
    /** Label text for the field */
    label = input.required<string>();
    
    /** Form control instance */
    control = input.required<FormControl>();
    
    /** Input type (text, email, number, date, textarea) */
    type = input<FormFieldType>('text');
    
    placeholder = input<string>('');
    
    required = input<boolean>(false);
    
    errorMessage = input<string>('');
    
    hint = input<string>('');
    
    rows = input<number>(4);
    
    min = input<string | number>('');
    
    max = input<string | number>('');
    
    maxLength = input<number>(1000);
    
    spellcheck = input<boolean>(false);
    
    /**
     * Determines if field has validation errors
     * @returns True if control is touched and invalid
     */
    hasError = computed(() => {
        const ctrl = this.control();
        return ctrl.touched && ctrl.invalid;
    });
    
    /**
     * Gets current validation errors
     * @returns Validation errors or null
     */
    validationErrors = computed((): ValidationErrors | null => {
        const ctrl = this.control();
        if (ctrl.touched && ctrl.errors) {
            return ctrl.errors;
        }
        return null;
    });
    
    /**
     * Generates appropriate error message for display
     * @returns Error message string
     */
    displayErrorMessage = computed(() => {
        const customMsg = this.errorMessage();
        if (customMsg && this.hasError()) {
            return customMsg;
        }
        
        const errors = this.validationErrors();
        if (!errors) return '';
        
        if (errors['required']) return 'This field is required';
        if (errors['email']) return 'Please enter a valid email address';
        if (errors['minlength']) {
            return `Minimum ${errors['minlength'].requiredLength} characters required`;
        }
        if (errors['maxlength']) {
            return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
        }
        if (errors['min']) return `Minimum value is ${errors['min'].min}`;
        if (errors['max']) return `Maximum value is ${errors['max'].max}`;
        if (errors['pattern']) return 'Invalid format';
        
        return 'Invalid input';
    });
    
    /**
     * Generates ARIA describedby attribute value
     * @returns Space-separated IDs or null
     */
    ariaDescribedby = computed(() => {
        const parts: string[] = [];
        const inputId = this.id();
        
        if (this.hasError()) {
            parts.push(`${inputId}-error`);
        }
        if (this.hint()) {
            parts.push(`${inputId}-hint`);
        }
        
        return parts.length > 0 ? parts.join(' ') : null;
    });
    
    /**
     * Generates CSS classes for input element
     * @returns CSS class object
     */
    inputClasses = computed(() => {
        return {
            'form-input': this.type() !== 'textarea',
            'form-textarea': this.type() === 'textarea',
            'error': this.hasError()
        };
    });
}
