import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
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
  
  showPassword = false;
  showConfirmPassword = false;
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

  onNameFocus(): void {
    this.nameError = false;
    this.signupFailError = false;
  }

  onEmailFocus(): void {
    this.emailError = false;
    this.signupFailError = false;
  }

  onPasswordFocus(): void {
    this.passwordError = false;
    this.signupFailError = false;
  }

  onConfirmPasswordFocus(): void {
    this.confirmPasswordError = false;
    this.signupFailError = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateForm(): boolean {
    let isValid = true;
    
    if (!this.name || this.name.trim().length < 2) {
      this.nameError = true;
      isValid = false;
    }
    
    if (!this.email || !this.email.includes('@')) {
      this.emailError = true;
      isValid = false;
    }
    
    if (!this.password || this.password.length < 6) {
      this.passwordError = true;
      isValid = false;
    }
    
    if (!this.confirmPassword || this.password !== this.confirmPassword) {
      this.confirmPasswordError = true;
      isValid = false;
    }

    if (!this.acceptPrivacy) {
      this.privacyError = true;
      isValid = false;
    }
    
    return isValid;
  }

  signup(): void {
    this.nameError = false;
    this.emailError = false;
    this.passwordError = false;
    this.confirmPasswordError = false;
    this.privacyError = false;
    this.signupFailError = false;

    if (!this.validateForm()) {
      return;
    }

    // TODO: Implement actual signup logic with AuthService
    // Simulated signup for now
    this.showSignupSuccess();
  }

  showSignupSuccess(): void {
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}
