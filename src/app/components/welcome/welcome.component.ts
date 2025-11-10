import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  createRequest() {
    this.router.navigate(['/create-request']);
  }
}
