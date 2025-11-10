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
    console.log('sendEmail() called'); // Debug
    const recipientEmail = 'duebel3@googlemail.com';
    const subject = 'Feature Request - Join Kanban';
    const body = 'Please describe your feature request, bug report, or question:\n\n';

    // Gmail Web Interface URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    console.log('Opening Gmail URL:', gmailUrl); // Debug
    window.open(gmailUrl, '_blank');
  }
}

