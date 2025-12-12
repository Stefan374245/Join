import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router , RouterLink} from '@angular/router';
import { FooterAuthComponent } from '../../../shared/components/footer-auth/footer-auth.component';
import { DailyLimitService } from '../../../services/daily-limit.service';

@Component({
  selector: 'app-stakeholder',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterAuthComponent],
  templateUrl: './stakeholder.component.html',
  styleUrls: ['./stakeholder.component.scss']
})
export class StakeholderComponent implements OnInit {
  private dailyLimitService = inject(DailyLimitService);
  private router = inject(Router);

  requestsUsed = 0;
  maxRequests = 10;
  isLoading = true;

  async ngOnInit() {
    await this.loadDailyLimit();
  }

  async loadDailyLimit() {
    try {
      const limitInfo = await this.dailyLimitService.fetchDailyLimit();
      this.requestsUsed = limitInfo.currentCount;
      this.maxRequests = limitInfo.maxLimit;
      console.log('📊 Daily Limit loaded:', limitInfo);
    } catch (error) {
      console.error('❌ Error loading daily limit:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
