import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreventDefaultDirective } from '../../shared/directives';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../core/services/toast.service';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';

// Constants
const POPUP_CHECK_INTERVAL_MS = 500;
const POPUP_MAX_CHECKS = 10;
const LOGIN_TIMEOUT_MS = 20000;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loginForm!: FormGroup;
  showPassword = false;
  passwordFocused = false;
  
  isLoading = signal<boolean>(false);
  private popupCheckInterval: number | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

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

  isLoginButtonDisabled(): boolean {
    return this.loginForm.invalid;
  }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getPasswordIcon(): string {
    const passwordControl = this.loginForm.get('password');
    if (!this.passwordFocused && !passwordControl?.value) {
      return 'assets/images/lock.svg';
    }
    return this.showPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    this.isLoading.set(true);
    try {
      await this.authService.login(email, password);
      this.showLoginSuccess();
    } catch (error: unknown) {
      this.handleLoginError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleLoginError(error: unknown): void {
    console.error('Login error:', error);
    const errorCode = (error as any)?.code;
    if (errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found') {
      this.loginForm.get('email')?.setErrors({ serverError: 'Invalid email or password' });
    } else if (errorCode === 'auth/wrong-password') {
      this.loginForm.get('password')?.setErrors({ serverError: 'Invalid password' });
    }
    this.toastService.showToast('Login failed. Please try again.');
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
      this.toastService.showToast('Guest login failed. Please try again.');
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

  private handleGoogleLoginError(error: unknown): void {
    console.error('❌ Google login error:', error);
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


