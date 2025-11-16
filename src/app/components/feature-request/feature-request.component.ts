import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-feature-request',
  imports: [CommonModule, RouterLink, FooterAuthComponent, FormsModule],
  templateUrl: './feature-request.component.html',
  styleUrl: './feature-request.component.scss'
})
export class FeatureRequestComponent {
  private http = inject(HttpClient);

  requestsUsed = 0;
  maxRequests = 10;

  requestType: 'feature' | 'bug' | 'question' = 'feature';
  requestTitle = '';
  requestDescription = '';
  stakeholderEmail = '';
  stakeholderName = '';

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  /**
   * Öffnet das Standard-Mail-Programm mit vorausgefüllten Daten
   */
  sendFeatureRequest() {
    // E-Mail-Empfänger
    const toEmail = 'requests@stefan-helldobler.de';

    // Subject basierend auf Request Type
    const typeLabels = {
      'feature': 'Feature Request',
      'bug': 'Bug Report',
      'question': 'Question'
    };
    const subject = `[${typeLabels[this.requestType]}] New Request`;

    // Body mit strukturierten Informationen
    const body = `
Hello Team,

I would like to submit a new ${typeLabels[this.requestType].toLowerCase()}.

---

**Type:** ${typeLabels[this.requestType]}
**Title:** ${this.requestTitle || '[Please add title]'}

**Description:**
${this.requestDescription || '[Please add description]'}

---

**Contact Information:**
Name: ${this.stakeholderName || '[Your name]'}
Email: ${this.stakeholderEmail || '[Your email]'}

**Important Features/Requirements:**
- [Add your requirements here]
-
-

---

Best regards
`.trim();

    const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    this.requestsUsed++;
    this.submitSuccess = true;
    setTimeout(() => {
      this.submitSuccess = false;
    }, 3000);
  }

  /**
   * Alternative: Sende direkt an n8n (falls du den Webhook behalten willst)
   */
  async sendDirectToN8n() {
    if (!this.requestTitle.trim() || !this.requestDescription.trim() || !this.stakeholderEmail.trim()) {
      this.submitError = 'Bitte fülle alle Pflichtfelder aus.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.stakeholderEmail)) {
      this.submitError = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      return;
    }

    if (this.isSubmitting || this.requestsUsed >= this.maxRequests) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      console.log('📤 Sende Request an n8n...');

      const response = await this.http.post<any>(environment.n8nWebhookUrl, {
        type: this.requestType,
        title: this.requestTitle,
        description: this.requestDescription,
        userEmail: this.stakeholderEmail,
        userName: this.stakeholderName || this.stakeholderEmail.split('@')[0],
        timestamp: new Date().toISOString()
      }).toPromise();

      console.log('✅ Request erfolgreich:', response);

      this.submitSuccess = true;
      this.requestsUsed++;

      // Reset form
      this.requestTitle = '';
      this.requestDescription = '';
      this.stakeholderEmail = '';
      this.stakeholderName = '';
      this.requestType = 'feature';

      setTimeout(() => {
        this.submitSuccess = false;
      }, 5000);

    } catch (error: any) {
      console.error('❌ Fehler:', error);

      if (error.status === 429) {
        this.submitError = 'Tageslimit erreicht. Bitte versuche es morgen erneut.';
      } else {
        this.submitError = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
