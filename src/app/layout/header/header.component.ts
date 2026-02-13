import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  showUserMenu = false;

  user = this.authService.currentUserSignal;
  isAuthenticated = this.authService.isAuthenticated;
  userDisplayName = this.authService.userDisplayName;
  userEmail = this.authService.userEmail;

  shouldShowHelpIcon(): boolean {
    const isLegalInfoPage = this.router.url.startsWith('/privacy-policy') || this.router.url.startsWith('/legal-notice');
    return this.isAuthenticated() || !isLegalInfoPage;
  }

  /**
   * Computed signal for user's initials.
   * @returns {string} Initials derived from display name or email.
   * @remarks Used for avatar display.
   */
  userInitials = computed(() => {
    const displayName = this.userDisplayName();
    const email = this.userEmail();
    return this.getUserInitials(displayName, email);
  });

  /**
   * Computed signal for user's color.
   * @returns {string} CSS variable for user color.
   * @remarks Used for avatar background color.
   */
  userColor = computed(() => {
    const email = this.userEmail();
    return this.getUserColor(email);
  });

  /**
   * Toggles the visibility of the user menu dropdown.
   * @returns {void}
   * @remarks Invoked when user avatar is clicked.
   */
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  /**
   * Closes the user menu dropdown.
   * @returns {void}
   */
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  /**
   * Logs out the current user and closes the user menu.
   * @returns {Promise<void>} Resolves when logout is complete.
   * @remarks Handles errors and logs them to console.
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.showUserMenu = false;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Gets the initials for the user based on display name or email.
   * @param displayName - The user's display name
   * @param email - The user's email address (optional)
   * @returns {string} Initials for avatar display
   * @remarks Returns 'G' for guest, 'U' for unknown, or first two letters of name.
   */
  getUserInitials(displayName: string | null, email?: string | null): string {
    if (email && email.toLowerCase() === 'guest@join.com') {
      return 'G';
    }
    if (!displayName) return 'U';
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Gets the color for the user avatar based on email.
   * @param email - The user's email address
   * @returns {string} CSS variable for user color
   * @remarks Hashes email to select one of 15 color variables.
   */
  getUserColor(email: string | null): string {
    if (!email) return 'var(--user-color-1)';

    const colors = 15;
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = (hash % colors) + 1;
    return `var(--user-color-${colorIndex})`;
  }
}
