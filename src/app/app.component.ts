import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  isAuthPage = true;
  isContactsPage = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      this.isAuthPage = url.startsWith('/login') ||
                       url.startsWith('/signup') ||
                       url.startsWith('/welcome') ||
                       url.startsWith('/create-request') ||
                       url.startsWith('/feature-request');
      this.isContactsPage = url.startsWith('/contacts');
    });
  }
}
