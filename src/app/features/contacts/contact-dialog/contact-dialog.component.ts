
import { Component, inject, Output, EventEmitter, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { StopPropagationDirective, DragDropDirective } from '../../../shared/directives';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contact } from '../../../core/models/contact.interface';
import { ContactSaveRequest } from '../../../core/models/contact-save-request.interface';
import { ContactAvatarUpload } from '../../../core/models/contact-avatar-upload.interface';
import { generateColorFromEmail } from '../../../core/services/auth/color-generator.helper';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ImageUploadFlowService } from '../../attachments/services/image-upload-flow.service';

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, StopPropagationDirective, DragDropDirective, FormInputComponent],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() contact: Contact | null = null;
  @Input() isSaving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ContactSaveRequest>();
  @Output() delete = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private imgFlow = inject(ImageUploadFlowService);

  contactForm!: FormGroup;
  isSubmitting = signal<boolean>(false);
  avatarPreviewUrl = signal<string | null>(null);
  avatarUpload = signal<ContactAvatarUpload | null>(null);
  removeAvatar = signal<boolean>(false);
  errorMessage = '';

  /**
   * Component initialization - sets up form and populates in edit mode
   * @return void
   * @remarks Initializes reactive form and populates with existing contact data if in edit mode
   */
  ngOnInit(): void {
    this.initForm();
    if (this.mode === 'edit' && this.contact) {
      this.populateForm();
    }

    if (this.contact?.avatarUrl) {
      this.avatarPreviewUrl.set(this.contact.avatarUrl);
    }
  }

  /**
   * Initializes reactive form with validation rules
   * @return void
   * @remarks Sets up form controls with appropriate validators for contact fields
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
   * @return void
   * @remarks Uses patchValue to fill form controls with contact's current information for editing
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
   * @returns Title string
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

  get isBusy(): boolean {
    return this.isSubmitting() || this.isSaving;
  }

  /**
   * Generates avatar initials from first and last name
   * @returns Two-letter initials string
   */
  get avatarInitials(): string {
    if (this.avatarPreviewUrl()) return '';

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

  async onDrop(files: File[]): Promise<void> {
    await this.procAvatar(files[0]);
  }

  async onPick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    await this.procAvatar(file);
    input.value = '';
  }

  clearAvatar(): void {
    this.avatarUpload.set(null);
    this.avatarPreviewUrl.set(null);
    this.removeAvatar.set(true);
  }

  onRemoveAvatarClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearAvatar();
  }

  private async procAvatar(file?: File): Promise<void> {
    if (!file) return;

    try {
      const img = await this.imgFlow.proc(file);
      this.setAvatar(img.base64, img.fileType);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process image';
      this.avatarErr(message);
    }
  }

  private avatarErr(message?: string): void {
    const error = message || 'Invalid image file';
    this.errorMessage = error;
    this.toastService.showError(error);
  }

  private setAvatar(base64: string, fileType: ContactAvatarUpload['fileType']): void {
    this.avatarUpload.set({ base64, fileType });
    this.avatarPreviewUrl.set(`data:${fileType};base64,${base64}`);
    this.removeAvatar.set(false);
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
    if (!this.isFormValid || this.isBusy) return;
    if (this.authService.isGuestUser()) return this.toastService.showGuestCannotAddContacts();

    this.isSubmitting.set(true);
    this.errorMessage = '';

    try {
      this.emitReq(this.mkContact());
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save contact';
      console.error('Error saving contact:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private mkContact(): Contact {
    return this.mode === 'add' ? this.mkNew() : this.mkEdit();
  }

  private mkNew(): Contact {
    const form = this.contactForm.value;
    const id = String(form.email).replace(/[.@]/g, '_');

    return {
      id,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || '',
      color: generateColorFromEmail(form.email),
      initials: this.avatarInitials,
    };
  }

  private mkEdit(): Contact {
    const form = this.contactForm.value;

    return {
      ...(this.contact as Contact),
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || '',
      initials: this.avatarInitials,
    };
  }

  private emitReq(contact: Contact): void {
    this.save.emit({
      contact,
      avatar: this.avatarUpload() || undefined,
      removeAvatar: this.removeAvatar(),
    });
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
