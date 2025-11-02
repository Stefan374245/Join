import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Logo animation on load
    setTimeout(() => {
      this.logoAnimationComplete = true;
    }, 500);
  }

  onPasswordFocus(): void {
    this.passwordError = false;
    this.loginFailError = false;
  }

  onEmailFocus(): void {
    this.emailError = false;
    this.loginFailError = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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

    // TODO: Implement actual login logic with AuthService
    // Simulated login for now
    if (this.email === 'test@test.com' && this.password === 'password') {
      this.showLoginSuccess();
    } else {
      this.loginFailError = true;
    }
  }

  guestLogin(): void {
    // TODO: Implement guest login
    this.showLoginSuccess();
  }

  showLoginSuccess(): void {
    this.showSuccessMessage = true;
    setTimeout(() => {
      // TODO: Navigate to dashboard/summary
      this.router.navigate(['/summary']);
    }, 2000);
  }
}
