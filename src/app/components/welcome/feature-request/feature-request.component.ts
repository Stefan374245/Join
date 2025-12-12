import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FooterAuthComponent } from '../../../shared/components/footer-auth/footer-auth.component';
import { environment } from '../../../../environments/environment';
import { DailyLimitService } from '../../../services/daily-limit.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-feature-request',
  imports: [CommonModule, RouterLink, FooterAuthComponent, FormsModule],
  templateUrl: './feature-request.component.html',
  styleUrl: './feature-request.component.scss'
})
export class FeatureRequestComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private dailyLimitService = inject(DailyLimitService);
  private toastService = inject(ToastService);

  requestsUsed = 0;
  maxRequests = 10;
  isLoading = true;
  isLimitReached = false;

  // Dropdown state
  showDropdown = false;

  requestType: 'feature' | 'bug' | 'question' = 'feature';
  requestTitle = '';
  requestDescription = '';
  stakeholderEmail = '';
  stakeholderName = '';

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  async ngOnInit() {
    await this.loadDailyLimit();
  }

  /**
   * Load current daily limit from Firestore
   */
  async loadDailyLimit() {
    try {
      const limitInfo = await this.dailyLimitService.fetchDailyLimit();
      this.requestsUsed = limitInfo.currentCount;
      this.maxRequests = limitInfo.maxLimit;
      this.isLimitReached = limitInfo.isLimitReached;

      console.log('📊 Daily Limit loaded:', limitInfo);

      if (this.isLimitReached) {
        this.toastService.showDailyLimitReached(this.maxRequests);
      } else if (limitInfo.remainingRequests <= 3 && limitInfo.remainingRequests > 0) {
        this.toastService.showDailyLimitWarning(limitInfo.remainingRequests);
      }
    } catch (error) {
      console.error('❌ Error loading daily limit:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggle Dropdown
   */
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Close Dropdown
   */
  closeDropdown() {
    this.showDropdown = false;
  }

  /**
   * OPTION 1: Mailto-Variante (E-Mail-Client öffnen)
   */
  async openMailtoVariant() {
    // Prüfe Limit bevor Email geöffnet wird
    if (this.isLimitReached) {
      this.toastService.showDailyLimitReached(this.maxRequests);
      this.closeDropdown();
      return;
    }

    this.closeDropdown();
    const toEmail = 'requests@stefan-helldobler.de';

    const typeLabels = {
      'feature': 'Feature Request',
      'bug': 'Bug Report',
      'question': 'Question'
    };
    const subject = `[${typeLabels[this.requestType]}] New Request`;

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

    this.submitSuccess = true;

    // Reload limit info (wird sich beim nächsten n8n-Durchlauf erhöhen)
    setTimeout(async () => {
      await this.loadDailyLimit();
      this.toastService.showSuccess(
        'Email opened! Your request will be processed shortly.'
      );
    }, 2000);

    setTimeout(() => {
      this.submitSuccess = false;
    }, 3000);
  }

  /**
   * OPTION 2: Webhook-Variante (Formular öffnen)
   * Navigiert zur neuen EmailMaskComponent
   */
  openWebhookVariant() {
    this.closeDropdown();
    this.router.navigate(['/email-mask']);
  }

  /**
   * Alternative: Sende direkt an n8n (falls du den Webhook behalten willst)
   */
  async sendDirectToN8n() {
    // Prüfe Limit
    if (this.isLimitReached) {
      this.toastService.showDailyLimitReached(this.maxRequests);
      return;
    }

    if (!this.requestTitle.trim() || !this.requestDescription.trim() || !this.stakeholderEmail.trim()) {
      this.submitError = 'Bitte fülle alle Pflichtfelder aus.';
      this.toastService.showError('Please fill out all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.stakeholderEmail)) {
      this.submitError = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      this.toastService.showError('Please enter a valid email address.');
      return;
    }

    if (this.isSubmitting) {
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

      // Reload limit
      await this.loadDailyLimit();

      const remaining = this.maxRequests - this.requestsUsed;
      this.toastService.showRequestSuccess(remaining);

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
        this.toastService.showDailyLimitReached(this.maxRequests);
      } else {
        this.submitError = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
        this.toastService.showError(
          'An error occurred. Please try again later.'
        );
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
