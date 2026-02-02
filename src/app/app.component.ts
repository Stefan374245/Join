import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title(_title: any) {
    throw new Error('Method not implemented.');
  }
  showMainLayout = false;
/**
 * Constructor sets up router event listener to toggle main layout visibility.
 *
 * @param router - Injected Angular Router for navigation event listening.
 * @remarks The main layout is hidden on authentication and informational pages. 
 */
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      const isAuthPage = url.startsWith('/login') ||
                         url.startsWith('/signup') ||
                         url.startsWith('/logo-animation') ||
                         url.startsWith('/hero') ||
                         url.startsWith('/request') ||
                         url.startsWith('/email-form');
      this.showMainLayout = !isAuthPage;
    });
  }
}
