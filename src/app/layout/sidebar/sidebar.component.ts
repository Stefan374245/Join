import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface SidebarNavLink {
  path: string;
  label: string;
  iconGray: string;
  iconWhite?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;

  navLinks: SidebarNavLink[] = [
    {
      path: '/summary',
      label: 'Summary',
      iconGray: 'assets/images/summarygray.svg',
      iconWhite: 'assets/images/summarywhite.svg'
    },
    {
      path: '/add-task',
      label: 'Add Task',
      iconGray: 'assets/images/addtaskgray.svg',
      iconWhite: 'assets/images/addtaskwhite.svg'
    },
    {
      path: '/board',
      label: 'Board',
      iconGray: 'assets/images/boardgray.svg',
      iconWhite: 'assets/images/boardwhite.svg'
    },
    {
      path: '/contacts',
      label: 'Contacts',
      iconGray: 'assets/images/contactsgray.svg',
      iconWhite: 'assets/images/contactswhite.svg'
    }
  ];

  legalLinks = [
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/legal-notice', label: 'Legal Notice' }
  ];

  guestLinks: SidebarNavLink[] = [
    {
      path: '/login',
      label: 'Log in',
      iconGray: 'assets/images/logingray.svg'
    }
  ];
  

  displayedNavLinks = computed(() => {
    return this.isAuthenticated() ? this.navLinks : this.guestLinks;
  });
}

