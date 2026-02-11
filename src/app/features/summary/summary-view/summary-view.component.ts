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

topStatsCards = computed(() => [
  {
    id: 'done',
    class: 'done-card',
    value: this.taskStats().done,
    label: 'Done',
    ariaLabel: `${this.taskStats().done} tasks done`,
    iconDefault: 'assets/images/check.svg',
    iconHover: 'assets/images/check-2.svg'
  },
  {
    id: 'todo',
    class: 'todo-card',
    value: this.taskStats().todo,
    label: 'To-do',
    ariaLabel: `${this.taskStats().todo} tasks to do`,
    iconDefault: 'assets/images/edit.svg',
    iconHover: 'assets/images/edit-2.svg'
  }
]);

  bottomStatsCards = computed(() => [
    {
      id: 'total-tasks',
      label: 'Tasks In<br />Board',
      value: this.taskStats().total,
      ariaLabel: `${this.taskStats().total} total tasks`
    },
    {
      id: 'progress-tasks',
      label: 'Tasks In<br />Progress',
      value: this.taskStats().inProgress,
      ariaLabel: `${this.taskStats().inProgress} tasks in progress`
    },
    {
      id: 'awaiting',
      label: 'Awaiting<br />Feedback',
      value: this.awaitingFeedbackTasks(),
      ariaLabel: `${this.awaitingFeedbackTasks()} tasks awaiting feedback`
    }
  ]);

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
