import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TaskService } from '../../../services/task.service';
import { Observable, map, combineLatest } from 'rxjs';

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

  isGuest$: Observable<boolean>;
  userName$: Observable<string>;
  greeting: string = '';

  totalTasks$: Observable<number>;
  todoTasks$: Observable<number>;
  inProgressTasks$: Observable<number>;
  doneTasks$: Observable<number>;
  urgentTasks$: Observable<number>;
  emailRequestsTasks$: Observable<number>;
  awaitingFeedbackTasks$: Observable<number>;
  nextUrgentDeadline$: Observable<Date | null>;
  formattedDeadline$: Observable<string>;

  constructor() {
    this.isGuest$ = this.authService.user$.pipe(
      map(user => user?.email === 'guest@join.com' || !user)
    );

    this.userName$ = this.authService.user$.pipe(
      map(user => user?.displayName || 'User')
    );

    this.totalTasks$ = this.taskService.getTasks().pipe(
      map(tasks => tasks.length)
    );

    this.todoTasks$ = this.taskService.getTasksByStatus('todo').pipe(
      map(tasks => tasks.length)
    );

    this.inProgressTasks$ = this.taskService.getTasksByStatus('in-progress').pipe(
      map(tasks => tasks.length)
    );

    this.doneTasks$ = this.taskService.getTasksByStatus('done').pipe(
      map(tasks => tasks.length)
    );

    this.urgentTasks$ = this.taskService.getUrgentTasks().pipe(
      map(tasks => tasks.length)
    );

    this.emailRequestsTasks$ = this.taskService.getTasks().pipe(
      map(tasks => tasks.filter(t => t.aiGenerated === true).length)
    );

    this.awaitingFeedbackTasks$ = this.taskService.getTasks().pipe(
      map(tasks => tasks.filter(t => t.status === 'await-feedback').length)
    );

    this.nextUrgentDeadline$ = this.taskService.getNextUrgentDeadline();

    this.formattedDeadline$ = this.nextUrgentDeadline$.pipe(
      map(deadline => {
        if (!deadline) return 'No urgent deadlines';

        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
        return deadline.toLocaleDateString('en-US', options);
      })
    );
  }

  ngOnInit(): void {
    this.setGreeting();
  }

  navigateToBoard(): void {
    this.router.navigate(['/board']);
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
