import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { environment } from '../../../environments/environment';

/**
 * Interface für Feature Request Payload
 */
interface FeatureRequestPayload {
  type: 'feature' | 'bug' | 'question';
  title: string;
  description: string;
  userEmail: string;
  userName: string;
  timestamp: string;
}

/**
 * Interface für API Response
 */
interface FeatureRequestResponse {
  success: boolean;
  message: string;
  ticketId?: string;
  requestsUsed?: number;
  maxRequests?: number;
  userEmail?: string;
  userName?: string;
}

@Component({
  selector: 'app-email-mask',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FooterAuthComponent],
  templateUrl: './email-mask.component.html',
  styleUrl: './email-mask.component.scss'
})
export class EmailMaskComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  requestForm!: FormGroup;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  requestsUsed = 0;
  maxRequests = 10;

  readonly requestTypes = [
    { value: 'feature', label: '💡 Feature Request', icon: '💡' },
    { value: 'bug', label: '🐛 Bug Report', icon: '🐛' },
    { value: 'question', label: '❓ Question', icon: '❓' }
  ] as const;

  constructor() {
    this.initForm();
  }

  /**
   * Initialisiert das Reactive Form mit Validatoren
   */
  private initForm(): void {
    this.requestForm = this.fb.group({
      requestType: ['feature', [Validators.required]],
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]],
      userName: ['', [
        Validators.maxLength(50)
      ]],
      userEmail: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]]
    });
  }

  /**
   * Getter für einfachen Zugriff auf Form Controls
   */
  get f() {
    return this.requestForm.controls;
  }

  /**
   * Prüft ob ein Feld einen Fehler hat und touched wurde
   */
  hasError(fieldName: string): boolean {
    const field = this.requestForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Gibt die Fehlermeldung für ein Feld zurück
   */
  getErrorMessage(fieldName: string): string {
    const field = this.requestForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['email'] || field.errors['pattern']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }

    return 'Invalid input';
  }

  /**
   * Hauptmethode: Sendet Feature Request an n8n Webhook
   */
  async onSubmit(): Promise<void> {
    // Form validieren
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.submitError = 'Please fill out all required fields correctly.';
      return;
    }

    // Rate Limiting prüfen
    if (this.requestsUsed >= this.maxRequests) {
      this.submitError = 'Daily limit reached. Please try again tomorrow.';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      const formValue = this.requestForm.value;

      const payload: FeatureRequestPayload = {
        type: formValue.requestType,
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        userEmail: formValue.userEmail.trim(),
        userName: formValue.userName?.trim() || formValue.userEmail.split('@')[0],
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending request to n8n webhook...', payload);

      const response = await this.http
        .post<FeatureRequestResponse>(environment.n8nWebhookUrl, payload)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      console.log('✅ Request successful:', response);

      if (response?.success) {
        this.handleSuccess(response);
      } else {
        throw new Error(response?.message || 'Unknown error occurred');
      }

    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Behandelt erfolgreiche Submission
   */
  private handleSuccess(response: FeatureRequestResponse): void {
    this.submitSuccess = true;

    // Update Request Counter
    if (response.requestsUsed !== undefined) {
      this.requestsUsed = response.requestsUsed;
    } else {
      this.requestsUsed++;
    }

    // Form zurücksetzen
    this.requestForm.reset({
      requestType: 'feature'
    });

    // Success Message nach 5 Sekunden ausblenden
    setTimeout(() => {
      this.submitSuccess = false;
    }, 5000);

    // Optional: Nach Success zurück zur Feature Request Seite
    // setTimeout(() => {
    //   this.router.navigate(['/feature-request']);
    // }, 3000);
  }

  /**
   * Behandelt Fehler bei Submission
   */
  private handleError(error: unknown): void {
    console.error('❌ Error submitting request:', error);

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 429:
          this.submitError = 'Daily limit reached. Please try again tomorrow.';
          break;
        case 400:
          this.submitError = 'Invalid request data. Please check your input.';
          break;
        case 0:
          this.submitError = 'Cannot connect to server. Please check your internet connection.';
          break;
        default:
          this.submitError = `Server error (${error.status}): ${error.message || 'Unknown error'}`;
      }
    } else if (error instanceof Error) {
      this.submitError = error.message;
    } else {
      this.submitError = 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Navigiert zurück zur Feature Request Seite
   */
  goBack(): void {
    this.router.navigate(['/feature-request']);
  }

  /**
   * Cleanup bei Component Destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
