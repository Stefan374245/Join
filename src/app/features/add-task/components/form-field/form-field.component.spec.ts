import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
    let component: FormFieldComponent;
    let fixture: ComponentFixture<FormFieldComponent>;
    let testControl: FormControl;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormFieldComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FormFieldComponent);
        component = fixture.componentInstance;
        testControl = new FormControl('');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render with required inputs', () => {
        fixture.componentRef.setInput('id', 'test-input');
        fixture.componentRef.setInput('label', 'Test Label');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        const label = fixture.nativeElement.querySelector('.form-label');
        expect(label.textContent).toContain('Test Label');
    });

    it('should render text input by default', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input[type="text"]');
        expect(input).toBeTruthy();
    });

    it('should render textarea when type is textarea', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('type', 'textarea');
        fixture.detectChanges();

        const textarea = fixture.nativeElement.querySelector('textarea');
        expect(textarea).toBeTruthy();
    });

    it('should render date input when type is date', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('type', 'date');
        fixture.detectChanges();

        const dateInput = fixture.nativeElement.querySelector('input[type="date"]');
        expect(dateInput).toBeTruthy();
    });

    it('should render email input when type is email', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('type', 'email');
        fixture.detectChanges();

        const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
        expect(emailInput).toBeTruthy();
    });

    it('should render number input when type is number', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('type', 'number');
        fixture.detectChanges();

        const numberInput = fixture.nativeElement.querySelector('input[type="number"]');
        expect(numberInput).toBeTruthy();
    });

    it('should not show error when control is pristine', () => {
        testControl.setValidators([Validators.required]);
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.hasError()).toBe(false);
        const errorMsg = fixture.nativeElement.querySelector('.error-message');
        expect(errorMsg).toBeFalsy();
    });

    it('should show error when control is touched and invalid', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        testControl.updateValueAndValidity();

        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.hasError()).toBe(true);
    });

    it('should display custom error message when provided', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('errorMessage', 'Custom error message');
        fixture.detectChanges();

        expect(component.displayErrorMessage()).toBe('Custom error message');
    });

    it('should display default error message for required validator', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.displayErrorMessage()).toBe('This field is required');
    });

    it('should display email validation error', () => {
        testControl.setValidators([Validators.email]);
        testControl.setValue('invalid-email');
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.displayErrorMessage()).toBe('Please enter a valid email address');
    });

    it('should display minlength validation error', () => {
        testControl.setValidators([Validators.minLength(5)]);
        testControl.setValue('abc');
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.displayErrorMessage()).toContain('Minimum 5 characters required');
    });

    it('should show required indicator when required is true', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('required', true);
        fixture.detectChanges();

        const requiredIndicator = fixture.nativeElement.querySelector('.required');
        expect(requiredIndicator).toBeTruthy();
        expect(requiredIndicator.textContent).toContain('*');
    });

    it('should not show required indicator when required is false', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('required', false);
        fixture.detectChanges();

        const requiredIndicator = fixture.nativeElement.querySelector('.required');
        expect(requiredIndicator).toBeFalsy();
    });

    it('should have correct aria-invalid attribute when invalid', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input');
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have correct aria-required attribute when required', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('required', true);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input');
        expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should link error message with aria-describedby', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test-field');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('errorMessage', 'Error');
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input');
        const describedBy = input.getAttribute('aria-describedby');
        expect(describedBy).toContain('test-field-error');
    });

    it('should display hint text when provided and no error', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('hint', 'This is a hint');
        fixture.detectChanges();

        const hint = fixture.nativeElement.querySelector('.form-hint');
        expect(hint).toBeTruthy();
        expect(hint.textContent).toContain('This is a hint');
    });

    it('should hide hint when error is displayed', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('hint', 'This is a hint');
        fixture.detectChanges();

        const hint = fixture.nativeElement.querySelector('.form-hint');
        expect(hint).toBeFalsy();
    });

    it('should set placeholder attribute', () => {
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.componentRef.setInput('placeholder', 'Enter text here');
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input');
        expect(input.getAttribute('placeholder')).toBe('Enter text here');
    });

    it('should apply error class when hasError is true', () => {
        testControl.setValidators([Validators.required]);
        testControl.markAsTouched();
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.inputClasses().error).toBe(true);
    });

    it('should not apply error class when control is valid', () => {
        testControl.setValue('valid value');
        
        fixture.componentRef.setInput('id', 'test');
        fixture.componentRef.setInput('label', 'Test');
        fixture.componentRef.setInput('control', testControl);
        fixture.detectChanges();

        expect(component.inputClasses().error).toBe(false);
    });
});
