import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DailyLimitService } from '../../../../core/services/daily-limit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FooterAuthComponent } from '../../../../shared/components/footer-auth/footer-auth.component';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { environment } from '../../../../../environments/environment';

interface PageConfig {
  title: string;
  subtitle: string;
  description: string[];
  showRequestLimit: boolean;
  email?: string;
  buttonText: string;
  buttonRoute: string;
  imagePath: string;
  limitDescription?: string;
}

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterAuthComponent, ClickOutsideDirective, FormsModule],
  templateUrl: './request-form.component.html',
  styleUrls: ['./request-form.component.scss']
})
export class RequestFormComponent implements OnInit {
  pageType: 'stakeholder' | 'feature-request' = 'stakeholder';
  config!: PageConfig;
  
  requestsUsed = 0;
  maxRequests = 10;
  isLimitReached = false;
  isLoading = true;
  
  showDropdown = false;
  submitSuccess = false;
  submitError = '';
  
  requestType: 'feature' | 'bug' | 'question' = 'feature';
  requestTitle = '';
  requestDescription = '';
  stakeholderEmail = '';
  stakeholderName = '';
  isSubmitting = false;
  
  private http = inject(HttpClient);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dailyLimitService: DailyLimitService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.pageType = params['type'];
      this.loadConfig();
      this.loadDailyLimit();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url.includes('/request/stakeholder')) {
        this.loadDailyLimit(true);
      }
    });
  }

  private loadConfig() {
    const configs: Record<string, PageConfig> = {
      stakeholder: {
        title: 'Welcome',
        subtitle: 'Easily create a ticket by sending an email — no extra steps needed.',
        description: [
          'On this platform, you can submit your feature requests via email. Our AI system will automatically generate a ticket with a deadline and priority level.',
          'A total of 10 requests can be created per day. After this limit, emails can still be sent, but they will be manually reviewed by our team instead of generating AI tickets.'
        ],
        showRequestLimit: true,
        buttonText: 'Create Request',
        buttonRoute: '/request/feature-request',
        imagePath: 'assets/images/stackholder.svg',
        limitDescription: 'Need more? No worries — you can still send emails, but our team will review them manually instead of using AI to create tickets.'
      },
      'feature-request': {
        title: 'Request',
        subtitle: 'Your request will be sent directly to our team',
        description: [
          'Your request will be sent directly to our team via email.',
          'Our AI will analyze it and automatically create a ticket in our system.',
          '',
          'Please describe your feature request, bug report, or question as detailed as possible.'
        ],
        showRequestLimit: false,
        email: 'requests@stefan-helldobler.de',
        buttonText: '📤 Submit Request',
        buttonRoute: '/email-form',
        imagePath: 'assets/images/stackholder.svg'
      }
    };

    this.config = configs[this.pageType];
  }

  private async loadDailyLimit(forceRefresh = false) {
    try {
      const limitInfo = await this.dailyLimitService.fetchDailyLimit(forceRefresh);
      this.requestsUsed = limitInfo.currentCount;
      this.maxRequests = limitInfo.maxLimit;
      this.isLimitReached = limitInfo.isLimitReached;

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

  onButtonClick(event: Event) {
    if (this.isLimitReached && this.config.showRequestLimit) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    if (this.pageType === 'feature-request') {
      this.toggleDropdown();
    } else {
      this.router.navigate([this.config.buttonRoute]);
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  openEmailLink() {
    this.router.navigate(['/email-form']);
  }

  openGmailCompose() {
    const toEmail = 'requests@stefan-helldobler.de';
    const subject = '[Feature Request] New Request';
    const body = `Hello Team,\n\nI would like to submit a feature request.\n\nBest regards`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    
    this.closeDropdown();
  }

  async openMailtoVariant() {
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

    setTimeout(async () => {
      await this.loadDailyLimit(true);
      this.toastService.showSuccess(
        'Email opened! Your request will be processed shortly.'
      );
    }, 2000);

    setTimeout(() => {
      this.submitSuccess = false;
    }, 3000);
  }

  openWebFormVariant() {
    this.closeDropdown();
    this.router.navigate(['/email-form']);
  }

  async sendDirectToN8n() {
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

      const response = await this.http.post<any>(environment.n8nWebhookUrl, {
        type: this.requestType,
        title: this.requestTitle,
        description: this.requestDescription,
        userEmail: this.stakeholderEmail,
        userName: this.stakeholderName || this.stakeholderEmail.split('@')[0],
        timestamp: new Date().toISOString()
      }).toPromise();

      this.submitSuccess = true;

      await this.loadDailyLimit(true);

      const remaining = this.maxRequests - this.requestsUsed;
      this.toastService.showRequestSuccess(remaining);

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
