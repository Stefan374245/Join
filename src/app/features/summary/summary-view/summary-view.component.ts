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

  isGuest = this.authService.isGuestUser;
  userName = this.authService.userDisplayName;
  taskStats = this.taskService.taskStats;
  nextUrgentDeadline = this.taskService.nextUrgentDeadline;
  
  greeting = '';
  
  formattedDeadline = computed(() => {
    const deadline = this.nextUrgentDeadline();
    return deadline ? this.formatDate(deadline) : '';
  });
  
  emailRequestsTasks = computed(() => 
    this.taskService.tasks().filter(task => task.source === 'email' || task.source === 'webhook').length
  );
  
  awaitingFeedbackTasks = computed(() => 
    this.taskService.tasksByStatus().awaitFeedback.length
  );

  /**
   * Constructor initializes greeting based on time of day and sets up dependencies.
   * 
   * @remarks This component provides a summary view of user tasks and greetings.
   */
  constructor() {
    this.setGreeting();
  }

  /**
   * Angular lifecycle hook called on component initialization.
   * @remarks Currently no initialization logic is required.
   */
  ngOnInit(): void {}

  /**
   * Navigates to the main board view.
   * 
   * @returns {void}
   * @remarks Invoked when the user clicks to view their task board.
   */
  navigateToBoard(): void {
    this.router.navigate(['/board']);
  }

  /**
   * Formats a given deadline date into a human-readable string.
   * 
   * @param {Date} deadline - The deadline date to format.
   * @returns {string} A formatted date string or a message if no deadline is provided.
   */
  private formatDate(deadline: Date): string {
    if (!deadline) return 'No urgent deadlines';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return deadline.toLocaleDateString('en-US', options);
  }

  /**
   * Sets the greeting message based on the current time of day.
   * 
   * @returns {void}
   * @remarks Updates the greeting property to reflect morning, afternoon, or evening.
   */
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
