import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, NgClass, ToastComponent],
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
                       url.startsWith('/logo-animation') ||
                       url.startsWith('/welcome') ||
                       url.startsWith('/stakeholder') ||
                       url.startsWith('/feature-request') ||
                       url.startsWith('/emailmask');
      this.isContactsPage = url.startsWith('/contacts');
    });
  }
}
