import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { LogoAnimationComponent } from '../logo-animation/logo-animation.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, LogoAnimationComponent],
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
  logoAnimationComplete = false;
  passwordFocused = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Animation wird jetzt durch die LogoAnimationComponent gesteuert
  }

  onAnimationComplete(): void {
    this.logoAnimationComplete = true;
  }

  /**
   * Check if login button should be disabled
   */
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

  login(): void {
    this.emailError = false;
    this.passwordError = false;
    this.loginFailError = false;

    if (!this.validateForm()) {
      return;
    }

    // Firebase login
    this.authService.login(this.email, this.password).subscribe({
      next: (userCredential) => {
        console.log('Login successful:', userCredential.user);
        this.showLoginSuccess();
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loginFailError = true;
        
        // Handle specific Firebase error codes
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          this.loginFailError = true;
        } else if (error.code === 'auth/invalid-email') {
          this.emailError = true;
        } else if (error.code === 'auth/too-many-requests') {
          this.loginFailError = true;
        }
      }
    });
  }

  guestLogin(): void {
    this.authService.guestLogin().subscribe({
      next: (userCredential) => {
        console.log('Guest login successful:', userCredential.user);
        this.showLoginSuccess();
      },
      error: (error) => {
        console.error('Guest login error:', error);
        this.loginFailError = true;
      }
    });
  }

  signInWithGoogle(): void {
    this.loginFailError = false;
    
    this.authService.signInWithGoogle().subscribe({
      next: (userCredential) => {
        console.log('Google login successful:', userCredential.user);
        this.showLoginSuccess();
      },
      error: (error) => {
        console.error('Google login error:', error);
        this.loginFailError = true;
        
        // Handle popup closed error gracefully
        if (error.code === 'auth/popup-closed-by-user') {
          this.loginFailError = false;
        }
      }
    });
  }

  showLoginSuccess(): void {
    this.showSuccessMessage = true;
    setTimeout(() => {
      // Navigate to board after successful login
      this.router.navigate(['/board']);
    }, 2000);
  }
}
