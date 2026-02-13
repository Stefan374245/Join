import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  signupForm!: FormGroup;
  acceptPrivacy = false;
  privacyError = false;
  
  isLoading = signal<boolean>(false);
  showPassword = false;
  showConfirmPassword = false;
  logoAnimationComplete = false;
  passwordFocused = false;
  confirmPasswordFocused = false;

  /**
   * Component initialization lifecycle hook.
   * @returns {void}
   * @remarks Triggers logo animation after 500ms and initializes form.
   */
  ngOnInit(): void {
    this.initForm();
    setTimeout(() => {
      this.logoAnimationComplete = true;
    }, 500);
  }

  /**
   * Initializes reactive form with validation rules
   */
  initForm(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.noSpacesValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator: No spaces allowed in password
   */
  private noSpacesValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && /\s/.test(control.value)) {
      return { hasSpaces: true };
    }
    return null;
  }

  /**
   * Custom validator: Passwords must match
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Checks if the signup button should be disabled.
   * @returns {boolean} True if form is invalid, otherwise false.
   */
  isSignupButtonDisabled(): boolean {
    return this.signupForm.invalid || !this.acceptPrivacy;
  }

  /**
   * Toggles password visibility in the input field.
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggles confirm password visibility in the input field.
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Toggles the privacy policy acceptance checkbox.
   */
  togglePrivacy(): void {
    this.acceptPrivacy = !this.acceptPrivacy;
    this.privacyError = false;
  }

  /**
   * Gets the icon path for the password field.
   */
  getPasswordIcon(): string {
    const passwordControl = this.signupForm.get('password');
    if (!this.passwordFocused && !passwordControl?.value) {
      return 'assets/images/lock.svg';
    }
    return this.showPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

  /**
   * Gets the icon path for the confirm password field.
   */
  getConfirmPasswordIcon(): string {
    const confirmPasswordControl = this.signupForm.get('confirmPassword');
    if (!this.confirmPasswordFocused && !confirmPasswordControl?.value) {
      return 'assets/images/lock.svg';
    }
    return this.showConfirmPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

  /**
   * Handles password focus
   */
  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  /**
   * Handles password blur
   */
  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  /**
   * Handles confirm password focus
   */
  onConfirmPasswordFocus(): void {
    this.confirmPasswordFocused = true;
  }

  /**
   * Handles confirm password blur
   */
  onConfirmPasswordBlur(): void {
    this.confirmPasswordFocused = false;
  }

  /**
   * Attempts to sign up with provided form data.
   */
  async signup(): Promise<void> {
    if (!this.acceptPrivacy) {
      this.privacyError = true;
      return;
    }

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const signupData = {
      name: this.signupForm.get('name')?.value,
      email: this.signupForm.get('email')?.value,
      password: this.signupForm.get('password')?.value
    };

    this.isLoading.set(true);
    try {
      await this.authService.signup(signupData);
      this.showSignupSuccess();
    } catch (error: unknown) {
      this.handleSignupError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handles signup errors and sets appropriate error states.
   */
  private handleSignupError(error: unknown): void {
    console.error('Signup error:', error);
    const errorCode = (error as any)?.code;
    if (errorCode === 'auth/email-already-in-use' || errorCode === 'auth/invalid-email') {
      this.signupForm.get('email')?.setErrors({ serverError: 'Email already in use' });
    }
    if (errorCode === 'auth/weak-password') {
      this.signupForm.get('password')?.setErrors({ serverError: 'Password is too weak' });
    }
    this.toastService.showToast('Signup failed. Please try again.');
  }

  /**
   * Shows signup success toast and navigates to login page.
   */
  showSignupSuccess(): void {
    this.toastService.showToast('Account created successfully!', 'success', 2000);
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}

