import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navLinks = [
    {
      path: '/summary',
      label: 'Summary',
      iconGray: '/assets/images/summarygray.svg',
      iconWhite: '/assets/images/summarywhite.svg'
    },
    {
      path: '/add-task',
      label: 'Add Task',
      iconGray: '/assets/images/addtaskgray.svg',
      iconWhite: '/assets/images/addtaskwhite.svg'
    },
    {
      path: '/board',
      label: 'Board',
      iconGray: '/assets/images/boardgray.svg',
      iconWhite: '/assets/images/boardwhite.svg'
    },
    {
      path: '/contacts',
      label: 'Contacts',
      iconGray: '/assets/images/contactsgray.svg',
      iconWhite: '/assets/images/contactswhite.svg'
    }
  ];

  legalLinks = [
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/legal-notice', label: 'Legal Notice' }
  ];
}

