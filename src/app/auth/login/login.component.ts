import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreventDefaultDirective } from '../../shared/directives';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../core/services/toast.service';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent, PreventDefaultDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  emailError = false;
  passwordError = false;
  loginFailError = false;
  showPassword = false;
  showSuccessMessage = false;
  passwordFocused = false;
  
  isLoading = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  /**
   * Component initialization lifecycle hook.
   * @returns {void}
   * @remarks No initialization logic required.
   */
  ngOnInit(): void {}

  /**
   * Checks if the login button should be disabled.
   * @returns {boolean} True if form is invalid, otherwise false.
   * @remarks Used to disable login button until form is valid.
   */
  isLoginButtonDisabled(): boolean {
    return !this.email ||
           !this.password ||
           !this.email.includes('@') ||
           this.password.length < 6;
  }

  /**
   * Handles password input focus event.
   * @returns {void}
   * @remarks Resets password and login error states.
   */
  onPasswordFocus(): void {
    this.passwordError = false;
    this.loginFailError = false;
    this.passwordFocused = true;
  }

  /**
   * Handles password input blur event.
   * @returns {void}
   * @remarks Sets passwordFocused to false.
   */
  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  /**
   * Handles email input focus event.
   * @returns {void}
   * @remarks Resets email and login error states.
   */
  onEmailFocus(): void {
    this.emailError = false;
    this.loginFailError = false;
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
   * Validates the login form fields.
   * @returns {boolean} True if form is valid, otherwise false.
   * @remarks Sets error states for invalid fields.
   */
  validateForm(): boolean {
    let isValid = true;
    if (!this.email || !this.email.includes('@')) {
      this.emailError = true;
      isValid = false;
    }
    if (!this.password || this.password.length < 6) {
      this.passwordError = true;
      isValid = false;
    }
    return isValid;
  }

  /**
   * Performs user login with email and password.
   * @returns {Promise<void>}
   * @remarks Shows success or error toast on completion.
   */
  async login(): Promise<void> {
    this.resetLoginErrors();
    if (!this.validateForm()) return;
    this.isLoading.set(true);
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      console.log('Login successful:', userCredential?.user);
      this.showLoginSuccess();
    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Resets login error states.
   * @returns {void}
   * @remarks Clears email, password, and login failure errors.
   */
  private resetLoginErrors(): void {
    this.emailError = false;
    this.passwordError = false;
    this.loginFailError = false;
  }

  /**
   * Handles login error by setting error states.
   * @returns {void}
   * @param error 
   * @remarks Logs error and updates UI error indicators.
   */
  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    this.loginFailError = true;
    if (error.code === 'auth/invalid-email') this.emailError = true;
  }

  /**
   * Logs in as a guest user.
   * @returns {Promise<void>}
   * @remarks Shows success or error toast on completion.
   */
  async guestLogin(): Promise<void> {
    this.isLoading.set(true);
    try {
      const userCredential = await this.authService.guestLogin();
      console.log('Guest login successful:', userCredential?.user);
      this.showLoginSuccess();
    } catch (error: any) {
      console.error('Guest login error:', error);
      this.loginFailError = true;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Signs in using Google authentication.
   * @returns {Promise<void>}
   * @remarks Handles popup errors and shows success or error toast.
   */
  async signInWithGoogle(): Promise<void> {
    this.loginFailError = false;
    this.isLoading.set(true);
    try {
      const userCredential = await this.authService.signInWithGoogle();
      console.log('Google login successful:', userCredential?.user);
      this.showLoginSuccess();
    } catch (error: any) {
      console.error('Google login error:', error);
      this.loginFailError = true;
      if (error.code === 'auth/popup-closed-by-user') {
        this.loginFailError = false;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Shows login success toast and navigates to summary page.
   * @returns {void}
   * @remarks Navigates after a short delay for user feedback.
   */
  showLoginSuccess(): void {
    this.toastService.showToast('You logged in successfully');
    setTimeout(() => {
      this.router.navigate(['/summary']);
    }, 2000);
  }
}


