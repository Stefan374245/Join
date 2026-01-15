import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

/**
 * Landing page hero component with navigation
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  constructor(private router: Router) {}

  /**
   * Navigates to login page
   */
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Navigates to feature request creation page
   */
  createRequest() {
    this.router.navigate(['/role/feature-request']);
  }
}