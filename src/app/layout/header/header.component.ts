import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  showUserMenu = false;
  user$ = this.authService.user$;

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  /**
   * Close user menu when clicking outside
   */
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.showUserMenu = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(displayName: string | null): string {
    if (!displayName) return 'U';
    
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Get user color based on email
   */
  getUserColor(email: string | null): string {
    if (!email) return 'var(--user-color-1)';
    
    const colors = 15;
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = (hash % colors) + 1;
    return `var(--user-color-${colorIndex})`;
  }
}
