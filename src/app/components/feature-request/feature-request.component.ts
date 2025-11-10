import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';

@Component({
  selector: 'app-feature-request',
  imports: [CommonModule, RouterLink, FooterAuthComponent],
  templateUrl: './feature-request.component.html',
  styleUrl: './feature-request.component.scss'
})
export class FeatureRequestComponent {
  requestsUsed = 0; // TODO: Fetch from Firestore
  maxRequests = 10;

  sendEmail() {
    const subject = 'Feature Request / Bug Report';
    const body = 'Please describe your request here...';
    const mailtoLink = `mailto:your-email@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
  }
}

