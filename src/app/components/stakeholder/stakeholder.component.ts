import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router , RouterLink} from '@angular/router';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';

@Component({
  selector: 'app-stakeholder',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterAuthComponent],
  templateUrl: './stakeholder.component.html',
  styleUrls: ['./stakeholder.component.scss']
})
export class StakeholderComponent {
  requestsUsed = 0;
  maxRequests = 10;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
