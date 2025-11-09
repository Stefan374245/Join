import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stakeholder',
  standalone: true,
  imports: [CommonModule],
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

  createRequest() {
    // TODO: Implement request creation
  }
}