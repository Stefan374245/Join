import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer-auth',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer-auth.component.html',
  styleUrl: './footer-auth.component.scss'
})
export class FooterAuthComponent {
  private router = inject(Router);

  navigateTo(path: '/privacy-policy' | '/legal-notice', event: Event): void {
    event.preventDefault();
    this.router.navigate([path]);
  }
}
