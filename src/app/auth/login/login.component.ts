import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../core/services/toast.service';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ToastComponent, FooterAuthComponent, LoadingSpinnerComponent],
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

  ngOnInit(): void {
  }

  isLoginButtonDisabled(): boolean {
    return !this.email ||
           !this.password ||
           !this.email.includes('@') ||
           this.password.length < 6;
  }

  onPasswordFocus(): void {
    this.passwordError = false;
    this.loginFailError = false;
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  onEmailFocus(): void {
    this.emailError = false;
    this.loginFailError = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getPasswordIcon(): string {
    if (!this.passwordFocused && !this.password) {
      return 'assets/images/lock.svg';
    }
    return this.showPassword ? 'assets/images/visibilityon.svg' : 'assets/images/visibilityoff.svg';
  }

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

  async login(): Promise<void> {
    this.emailError = false;
    this.passwordError = false;
    this.loginFailError = false;

    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      console.log('Login successful:', userCredential?.user);
      this.showLoginSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      this.loginFailError = true;

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        this.loginFailError = true;
      } else if (error.code === 'auth/invalid-email') {
        this.emailError = true;
      } else if (error.code === 'auth/too-many-requests') {
        this.loginFailError = true;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

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

  showLoginSuccess(): void {
    this.toastService.showToast('You logged in successfully');
    setTimeout(() => {
      this.router.navigate(['/summary']);
    }, 2000);
  }
}


