import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DailyLimitService } from '../../../../core/services/daily-limit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FooterAuthComponent } from '../../../../shared/components/footer-auth/footer-auth.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-email-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FooterAuthComponent],
  templateUrl: './email-form.component.html',
  styleUrls: ['./email-form.component.scss']
})
export class EmailFormComponent implements OnInit {
  requestType: 'feature' | 'bug' | 'question' = 'feature';
  requestTitle = '';
  requestDescription = '';
  stakeholderEmail = '';
  stakeholderName = '';
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  
  requestsUsed = 0;
  maxRequests = 10;
  isLimitReached = false;
  isLoading = true;

  private http = inject(HttpClient);

  constructor(
    private router: Router,
    private dailyLimitService: DailyLimitService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadDailyLimit();
  }

  private async loadDailyLimit() {
    try {
      const limitInfo = await this.dailyLimitService.fetchDailyLimit(true);
      this.requestsUsed = limitInfo.currentCount;
      this.maxRequests = limitInfo.maxLimit;
      this.isLimitReached = limitInfo.isLimitReached;

      if (this.isLimitReached) {
        this.toastService.showDailyLimitReached(this.maxRequests);
      }
    } catch (error) {
      console.error('❌ Error loading daily limit:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    if (this.isLimitReached) {
      this.toastService.showDailyLimitReached(this.maxRequests);
      return;
    }

    if (!this.requestTitle.trim() || !this.requestDescription.trim() || !this.stakeholderEmail.trim()) {
      this.submitError = 'Please fill out all required fields.';
      this.toastService.showError('Please fill out all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.stakeholderEmail)) {
      this.submitError = 'Please enter a valid email address.';
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
      console.log('📤 Sending request to n8n...');

      const response = await this.http.post<any>(environment.n8nWebhookUrl, {
        type: this.requestType,
        title: this.requestTitle,
        description: this.requestDescription,
        userEmail: this.stakeholderEmail,
        userName: this.stakeholderName || this.stakeholderEmail.split('@')[0],
        timestamp: new Date().toISOString()
      }).toPromise();

      console.log('✅ Request successful:', response);

      this.submitSuccess = true;

      await this.loadDailyLimit();

      const remaining = this.maxRequests - this.requestsUsed;
      this.toastService.showRequestSuccess(remaining);

      this.requestTitle = '';
      this.requestDescription = '';
      this.stakeholderEmail = '';
      this.stakeholderName = '';
      this.requestType = 'feature';

      setTimeout(() => {
        this.router.navigate(['/request/stakeholder']);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error:', error);

      if (error.status === 429) {
        this.submitError = 'Daily limit reached. Please try again tomorrow.';
        this.toastService.showDailyLimitReached(this.maxRequests);
      } else {
        this.submitError = 'An error occurred. Please try again later.';
        this.toastService.showError('An error occurred. Please try again later.');
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/role/feature-request']);
  }
}
