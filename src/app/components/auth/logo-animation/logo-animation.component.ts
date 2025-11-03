import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 800;
    this.startAnimation();
  }

  private startAnimation(): void {
    // Phase 1: Show logo in center (hidden -> center)
    setTimeout(() => {
      this.animationState = 'center';
    }, 0);

    // Phase 2: Expand logo (center -> expanding)
    setTimeout(() => {
      this.animationState = 'expanding';
    }, 500);

    // Phase 3: Shrink and move to top-right (expanding -> shrinking)
    setTimeout(() => {
      this.animationState = 'shrinking';
    }, 1500);

    // Phase 4: Final position top-right (shrinking -> final)
    setTimeout(() => {
      this.animationState = 'final';
      this.animationComplete.emit();
    }, 2500);
  }

  getLogoSrc(): string {
    if (this.isMobile && (this.animationState === 'center' || this.animationState === 'expanding' || this.animationState === 'shrinking')) {
      return 'assets/images/joinlogowhite.svg';
    }
    return 'assets/images/joinlogodark.svg';
  }
}
