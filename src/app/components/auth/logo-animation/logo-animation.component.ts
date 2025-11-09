import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-logo-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-animation.component.html',
  styleUrl: './logo-animation.component.scss'
})
export class LogoAnimationComponent implements OnInit {
  @Output() animationComplete = new EventEmitter<void>();

  animationState: 'hidden' | 'center' | 'expanding' | 'shrinking' | 'final' = 'hidden';
  isMobile = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 800;
    this.startAnimation();
  }

  private startAnimation(): void {
    setTimeout(() => {
      this.animationState = 'center';
    }, 0);

    setTimeout(() => {
      this.animationState = 'expanding';
    }, 500);

    setTimeout(() => {
      this.animationState = 'shrinking';
    }, 1500);

    setTimeout(() => {
      this.animationState = 'final';
      this.animationComplete.emit();
      this.router.navigate(['/welcome']);
    }, 2500);
  }

  getLogoSrc(): string {
    if (this.isMobile && (this.animationState === 'center' || this.animationState === 'expanding' || this.animationState === 'shrinking')) {
      return 'assets/images/joinlogowhite.svg';
    }
    return 'assets/images/joinlogodark.svg';
  }
}
