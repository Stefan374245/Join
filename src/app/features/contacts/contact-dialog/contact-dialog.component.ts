import { Component, inject, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../../core/services/contact.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contact } from '../../../core/models/contact.interface';

/**
 * Modal dialog for adding/editing contacts with form validation
 */
@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() contact: Contact | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Contact>();
  @Output() delete = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  contactForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  /**
   * Component initialization - sets up form and populates in edit mode
   */
  ngOnInit(): void {
    this.initForm();
    if (this.mode === 'edit' && this.contact) {
      this.populateForm();
    }
  }

  /**
   * Initializes reactive form with validation rules
   */
  initForm(): void {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-()]{10,}$/)]]
    });
  }

  /**
   * Populates form with existing contact data in edit mode
   */
  populateForm(): void {
    if (this.contact) {
      this.contactForm.patchValue({
        firstName: this.contact.firstName,
        lastName: this.contact.lastName,
        email: this.contact.email,
        phone: this.contact.phone || ''
      });
    }
  }

  /**
   * Returns form validation status
   * @returns True if form is valid
   */
  get isFormValid(): boolean {
    return this.contactForm.valid;
  }

  /**
   * Returns dialog title based on mode
   * @returns Dialog title string
   */
  get title(): string {
    return this.mode === 'add' ? 'Add contact' : 'Edit contact';
  }

  /**
   * Returns submit button text based on mode
   * @returns Button text string
   */
  get submitButtonText(): string {
    return this.mode === 'add' ? 'Create contact' : 'Save';
  }

  /**
   * Generates avatar initials from first and last name
   * @returns Two-letter initials string
   */
  get avatarInitials(): string {
    const firstName = this.contactForm.get('firstName')?.value || '';
    const lastName = this.contactForm.get('lastName')?.value || '';

    if (!firstName && !lastName) return '';

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Returns avatar color - existing color in edit mode, default in add mode
   * @returns Hexadecimal color string
   */
  get avatarColor(): string {
    if (this.mode === 'edit' && this.contact) {
      return this.contact.color;
    }
    return '#D1D1D1';
  }

  /**
   * Emits close event to parent component
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Emits delete event with contact email
   */
  onDelete(): void {
    if (this.contact?.email) {
      this.delete.emit(this.contact.email);
    }
  }

  /**
   * Handles form submission for add/edit operations
   */
  async onSubmit(): Promise<void> {
    if (!this.isFormValid || this.isSubmitting) return;

    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.contactForm.value;
      const fullName = `${formValue.firstName} ${formValue.lastName}`;
      const initials = this.avatarInitials;

      if (this.mode === 'add') {
        const email = formValue.email;
        const color = this.generateColorFromEmail(email);
        const id = email.replace(/[.@]/g, '_');

        const newContact: Contact = {
          id: id,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phone: formValue.phone || '',
          color: color,
          initials: initials
        };

        this.save.emit(newContact);
      } else if (this.mode === 'edit' && this.contact) {
        const updatedContact: Contact = {
          ...this.contact,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phone: formValue.phone || '',
          initials: initials
        };

        this.save.emit(updatedContact);
      }
    } catch (error: any) {
      console.error('Error saving contact:', error);
      this.errorMessage = error.message || 'Failed to save contact';
      this.isSubmitting = false;
    }
  }

  /**
   * Generates consistent color from email address
   * @param email - Email address
   * @returns Hexadecimal color code
   */
  private generateColorFromEmail(email: string): string {
    const colors = [
      '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
      '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
      '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B'
    ];

    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  }

  /**
   * Returns validation error message for form field
   * @param fieldName - Name of the form field
   * @returns Error message string
   */
  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['email']) return 'Invalid email address';
    if (field.errors['pattern']) return 'Invalid phone number';

    return '';
  }
}
