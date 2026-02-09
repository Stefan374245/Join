import { Component, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreventDefaultDirective } from '../../shared/directives';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../core/services/toast.service';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

// Constants
const POPUP_CHECK_INTERVAL_MS = 500;
const POPUP_MAX_CHECKS = 10;
const LOGIN_TIMEOUT_MS = 20000;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent, PreventDefaultDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  email = '';
  password = '';
  emailError = false;
  passwordError = false;
  loginFailError = false;
  showPassword = false;
  passwordFocused = false;
  
  isLoading = signal<boolean>(false);
  private popupCheckInterval: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  /**
   * Component cleanup lifecycle hook.
   * @returns {void}
   * @remarks Clears any active intervals on component destruction.
   */
  ngOnDestroy(): void {
    if (this.popupCheckInterval !== null) {
      clearInterval(this.popupCheckInterval);
    }
  }

  /**
   * Checks if the login button should be disabled.
   * @returns {boolean} True if form is invalid, otherwise false.
   * @remarks Used to disable login button until form is valid.
   */
  isLoginButtonDisabled(): boolean {
    return !this.email ||
           !this.password ||
           !this.isValidEmail(this.email) ||
           !this.isValidPassword(this.password);
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
   * @remarks Validates password when field loses focus.
   */
  onPasswordBlur(): void {
    this.passwordFocused = false;
    if (this.password && !this.isValidPassword(this.password)) {
      this.passwordError = true;
    }
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
   * Validates password format.
   * @param password - Password to validate
   * @returns {boolean} True if valid password format
   * @remarks Password must be at least 6 characters and contain no spaces
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 6 && !/\s/.test(password);
  }

  /**
   * Validates the login form fields.
   * @returns {boolean} True if form is valid, otherwise false.
   * @remarks Sets error states for invalid fields.
   */
  validateForm(): boolean {
    let isValid = true;
    if (!this.email || !this.isValidEmail(this.email)) {
      this.emailError = true;
      isValid = false;
    }
    if (!this.password || !this.isValidPassword(this.password)) {
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
      await this.authService.login(this.email, this.password);
      this.showLoginSuccess();
    } catch (error: unknown) {
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
   * @param error - Error from login attempt
   * @returns {void}
   * @remarks Logs error and updates UI error indicators.
   */
  private handleLoginError(error: unknown): void {
    console.error('Login error:', error);
    this.loginFailError = true;
    if ((error as any)?.code === 'auth/invalid-email') this.emailError = true;
  }

  /**
   * Logs in as a guest user.
   * @returns {Promise<void>}
   * @remarks Shows success or error toast on completion.
   */
  async guestLogin(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.authService.guestLogin();
      this.showLoginSuccess();
    } catch (error: unknown) {
      console.error('Guest login error:', error);
      this.loginFailError = true;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Signs in using Google authentication with popup.
   * @returns {Promise<void>}
   * @remarks Shows success or error toast. Monitors popup for immediate response.
   */
  async signInWithGoogle(): Promise<void> {
    this.loginFailError = false;
    this.isLoading.set(true);
    const timeoutId = this.setupLoginTimeout();
    this.startPopupMonitor();
    try {
      await this.authService.signInWithGoogle();
      this.cleanupMonitoring(timeoutId);
      this.showLoginSuccess();
    } catch (error: unknown) {
      this.cleanupMonitoring(timeoutId);
      if ((error as any)?.code !== 'auth/popup-closed-by-user') this.handleGoogleLoginError(error);
    } finally { this.isLoading.set(false); }
  }

  /**
   * Cleans up monitoring timers.
   * @param timeoutId - Timeout to clear
   * @returns {void}
   */
  private cleanupMonitoring(timeoutId: NodeJS.Timeout): void {
    this.stopPopupMonitor();
    clearTimeout(timeoutId);
  }

  /**
   * Starts monitoring popup with aggressive timeout.
   * @returns {void}
   * @remarks Stops spinner after 5s if no response (assumes popup closed)
   */
  private startPopupMonitor(): void {
    let checkCount = 0;
    this.popupCheckInterval = window.setInterval(() => {
      checkCount++;
      if (checkCount > POPUP_MAX_CHECKS && this.isLoading()) {
        this.stopPopupMonitor();
        this.isLoading.set(false);
      }
    }, POPUP_CHECK_INTERVAL_MS);
  }

  /**
   * Stops popup monitoring.
   * @returns {void}
   */
  private stopPopupMonitor(): void {
    if (this.popupCheckInterval !== null) {
      clearInterval(this.popupCheckInterval);
      this.popupCheckInterval = null;
    }
  }

  /**
   * Sets up timeout for login operations.
   * @returns {NodeJS.Timeout} Timeout ID
   * @remarks Stops spinner and shows toast after 20 seconds
   */
  private setupLoginTimeout(): NodeJS.Timeout {
    return setTimeout(() => {
      if (this.isLoading()) {
        this.isLoading.set(false);
        this.toastService.showToast('Login timeout. Please try again.');
      }
    }, LOGIN_TIMEOUT_MS);
  }

  /**
   * Handles Google login errors.
   * @param error - Error object from Google login
   * @returns {void}
   * @remarks Logs error and shows user-friendly toast message
   */
  private handleGoogleLoginError(error: unknown): void {
    console.error('❌ Google login error:', error);
    this.loginFailError = true;
    this.toastService.showToast('Google login failed. Please try again.');
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


