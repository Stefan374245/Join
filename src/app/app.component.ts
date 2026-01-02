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
  showMainLayout = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      const isAuthPage = url.startsWith('/login') ||
                         url.startsWith('/signup') ||
                         url.startsWith('/logo-animation') ||
                         url.startsWith('/welcome') ||
                         url.startsWith('/stakeholder') ||
                         url.startsWith('/feature-request') ||
                         url.startsWith('/emailmask');
      this.showMainLayout = !isAuthPage;
    });
  }
}
