import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreventDefaultDirective } from '../../shared/directives';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent, PreventDefaultDirective],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptPrivacy = false;

  nameError = false;
  emailError = false;
  passwordError = false;
  confirmPasswordError = false;
  privacyError = false;
  signupFailError = false;
  
  isLoading = signal<boolean>(false);

  showPassword = false;
  showConfirmPassword = false;
  logoAnimationComplete = false;
  passwordFocused = false;
  confirmPasswordFocused = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

    /**
     * Component initialization lifecycle hook.
     * @returns {void}
     * @remarks Triggers logo animation after 500ms.
     */
    ngOnInit(): void {
      setTimeout(() => {
        this.logoAnimationComplete = true;
      }, 500);
    }

    /**
     * Checks if the signup button should be disabled.
     * @returns {boolean} True if form is invalid, otherwise false.
     * @remarks Used to disable signup button until form is valid.
     */
  isSignupButtonDisabled(): boolean {
    return !this.name ||
           !this.email ||
           !this.password ||
           !this.confirmPassword ||
           !this.acceptPrivacy ||
           this.name.trim().length < 2 ||
           !this.isValidEmail(this.email) ||
           !this.isValidPassword(this.password) ||
           this.password !== this.confirmPassword;
  }

    /**
     * Handles name input focus event.
     * @returns {void}
     * @remarks Resets name and signup error states.
     */
  onNameFocus(): void {
    this.nameError = false;
    this.signupFailError = false;
  }

    /**
     * Handles name input blur event.
     * @returns {void}
     * @remarks Sets nameError if name is too short.
     */
  onNameBlur(): void {
    if (this.name && this.name.trim().length < 2) {
      this.nameError = true;
    }
  }

    /**
     * Handles email input focus event.
     * @returns {void}
     * @remarks Resets email and signup error states.
     */
  onEmailFocus(): void {
    this.emailError = false;
    this.signupFailError = false;
  }

    /**
     * Handles email input blur event.
     * @returns {void}
     * @remarks Validates email format when field loses focus.
     */
  onEmailBlur(): void {
    if (this.email && !this.isValidEmail(this.email)) {
      this.emailError = true;
    }
  }

    /**
     * Handles password input focus event.
     * @returns {void}
     * @remarks Resets password and signup error states.
     */
  onPasswordFocus(): void {
    this.passwordError = false;
    this.signupFailError = false;
    this.passwordFocused = true;
  }

    /**
     * Handles password input blur event.
     * @returns {void}
     * @remarks Validates password when field loses focus.
     */
  onPasswordBlur(): void {
    this.passwordFocused = false;
    if (this.password && !this.isValidPassword(this.password)) {
      this.passwordError = true;
    }
  }

    /**
     * Handles confirm password input focus event.
     * @returns {void}
     * @remarks Resets confirmPassword and signup error states.
     */
  onConfirmPasswordFocus(): void {
    this.confirmPasswordError = false;
    this.signupFailError = false;
    this.confirmPasswordFocused = true;
  }

    /**
     * Handles confirm password input blur event.
     * @returns {void}
     * @remarks Sets confirmPasswordError if passwords do not match.
     */
  onConfirmPasswordBlur(): void {
    this.confirmPasswordFocused = false;
    if (this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordError = true;
    }
  }

    /**
     * Toggles password visibility in the input field.
     * @returns {void}
     * @remarks Switches between masked and visible password.
     */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

    /**
     * Toggles confirm password visibility in the input field.
     * @returns {void}
     * @remarks Switches between masked and visible confirm password.
     */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

    /**
     * Toggles the privacy policy acceptance checkbox.
     * @returns {void}
     * @remarks Used to make the checkbox clickable via the container and label.
     */
  togglePrivacy(): void {
    this.acceptPrivacy = !this.acceptPrivacy;
    this.privacyError = false;
  }

    /**
     * Gets the icon path for the password field.
     * @returns {string} Path to the icon image.
     * @remarks Changes icon based on password state and focus.
     */
  getPasswordIcon(): string {
    if (!this.passwordFocused && !this.password) {
      return 'assets/images/lock.svg';
    }
    return this.showPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

    /**
     * Gets the icon path for the confirm password field.
     * @returns {string} Path to the icon image.
     * @remarks Changes icon based on confirm password state and focus.
     */
  getConfirmPasswordIcon(): string {
    if (!this.confirmPasswordFocused && !this.confirmPassword) {
      return 'assets/images/lock.svg';
    }
    return this.showConfirmPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

    /**
     * Validates the signup form fields.
     * @returns {boolean} True if form is valid, otherwise false.
     * @remarks Sets error states for invalid fields.
     */
  validateForm(): boolean {
    let isValid = true;
    if (!this.isNameValid()) { this.nameError = true; isValid = false; }
    if (!this.isEmailValid()) { this.emailError = true; isValid = false; }
    if (!this.isPasswordValid()) { this.passwordError = true; isValid = false; }
    if (!this.isConfirmPasswordValid()) { this.confirmPasswordError = true; isValid = false; }
    if (!this.acceptPrivacy) { this.privacyError = true; isValid = false; }
    return isValid;
  }

  /**
   * Checks if name is valid.
   * @return {boolean} True if name is valid
   * @remarks Name must be at least 2 characters
   */
  private isNameValid(): boolean {
    return !!this.name && this.name.trim().length >= 2;
  }

  /**
   * Validates email format using regex.
   * @param email - Email address to validate
   * @returns {boolean} True if valid email format
   * @remarks Checks for basic email structure: user@domain.extension
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Checks if email is valid.
   *  @return {boolean} True if email is valid
   * @remarks Email must match regex pattern
   */
  private isEmailValid(): boolean {
    return !!this.email && this.isValidEmail(this.email);
  }

  /**
   * Validates password format.
   * @param password - Password to validate
   * @returns {boolean} True if valid password format
   * @remarks Password must be at least 6 characters and contain no spaces
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 6 && !/\s/.test(password);
  }

  /**
   * Checks if password is valid.
  * @return {boolean} True if password is valid
  * @remarks Password must be at least 6 characters with no spaces
   */
  private isPasswordValid(): boolean {
    return !!this.password && this.isValidPassword(this.password);
  }

  /**
   * Checks if confirm password is valid.
  * @return {boolean} True if confirm password matches password
  * @remarks Confirm password must match password
   */
  private isConfirmPasswordValid(): boolean {
    return !!this.confirmPassword && this.password === this.confirmPassword;
  }

    /**
     * Attempts to sign up with provided form data.
     * @returns {Promise<void>}
     * @remarks Handles error states and shows success on signup.
     */
  async signup(): Promise<void> {
    this.resetSignupErrors();
    if (!this.validateForm()) return;
    const signupData = { name: this.name, email: this.email, password: this.password };
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
     * Resets all signup error states.
     * @returns {void}
     * @remarks Used before form validation and signup attempt.
     */
  private resetSignupErrors() {
    this.nameError = false;
    this.emailError = false;
    this.passwordError = false;
    this.confirmPasswordError = false;
    this.privacyError = false;
    this.signupFailError = false;
  }

    /**
     * Handles signup errors and sets appropriate error states.
     * @param error - The error object from signup attempt
     * @returns {void}
     * @remarks Shows toast message for error feedback.
     */
  private handleSignupError(error: unknown): void {
    console.error('Signup error:', error);
    const errorCode = (error as any)?.code;
    if (errorCode === 'auth/email-already-in-use' || errorCode === 'auth/invalid-email') this.emailError = true;
    if (errorCode === 'auth/weak-password') this.passwordError = true;
    this.toastService.showToast('Signup failed. Please try again.');
  }

    /**
     * Shows signup success toast and navigates to login page.
     * @returns {void}
     * @remarks Navigates after a short delay for user feedback.
     */
  showSignupSuccess(): void {
    this.toastService.showToast('Account created successfully!', 'success', 2000);
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}

