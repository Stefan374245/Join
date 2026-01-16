import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-summary-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-view.component.html',
  styleUrl: './summary-view.component.scss'
})
export class SummaryViewComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);

  // Use AuthService signals instead of Observables
  isGuest = this.authService.isGuestUser;
  userName = this.authService.userDisplayName;
  
  greeting = '';

  // Use TaskService signals directly
  taskStats = this.taskService.taskStats;
  nextUrgentDeadline = this.taskService.nextUrgentDeadline;
  
  formattedDeadline = computed(() => {
    const deadline = this.nextUrgentDeadline();
    return deadline ? this.formatDate(deadline) : '';
  });
  
  emailRequestsTasks = computed(() => 
    this.taskService.tasks().filter(task => task.source === 'email').length
  );
  
  awaitingFeedbackTasks = computed(() => 
    this.taskService.tasksByStatus().awaitFeedback.length
  );

  constructor() {
    // Set greeting based on time of day
    this.setGreeting();
  }

  ngOnInit(): void {
    this.setGreeting();
  }

  navigateToBoard(): void {
    this.router.navigate(['/board']);
  }

  private formatDate(deadline: Date): string {
    if (!deadline) return 'No urgent deadlines';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return deadline.toLocaleDateString('en-US', options);
  }

  private setGreeting(): void {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good morning,';
    } else if (hour >= 12 && hour < 18) {
      this.greeting = 'Good afternoon,';
    } else {
      this.greeting = 'Good evening,';
    }
  }
}
