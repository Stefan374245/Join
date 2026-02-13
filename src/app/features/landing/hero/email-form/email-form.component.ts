import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DailyLimitService } from '../../../../core/services/daily-limit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FooterAuthComponent } from '../../../../shared/components/footer-auth/footer-auth.component';
import { environment } from '../../../../../environments/environment';
import { DropdownComponent } from '../../../add-task/components/dropdown/dropdown.component';
import { FormFieldComponent } from '../../../add-task/components/form-field/form-field.component';
import { FormInputComponent } from '../../../../shared/components/form-input/form-input.component';


@Component({
  selector: 'app-email-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FooterAuthComponent, DropdownComponent, FormFieldComponent, FormInputComponent],
  templateUrl: './email-form.component.html',
  styleUrls: ['./email-form.component.scss']
})
export class EmailFormComponent implements OnInit {
  requestForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  
  requestsUsed = 0;
  maxRequests = 10;
  isLimitReached = false;
  isLoading = true;
  requestTypeItems = [
  { id: 'feature', label: 'Feature Request' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'question', label: 'Question' }
];

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  constructor(
    private router: Router,
    private dailyLimitService: DailyLimitService,
    private toastService: ToastService
  ) {}

  /**
   * Initializes the form and loads the daily limit.
   * @returns {void}
   * @remarks Calls loadDailyLimit to set the current limits.
   */
  ngOnInit(): void {
    this.initForm();
    this.loadDailyLimit();
  }

  private initForm(): void {
    this.requestForm = this.fb.group({
      requestType: ['feature', Validators.required],
      requestTitle: ['', [Validators.required, Validators.minLength(3)]],
      requestDescription: ['', [Validators.required, Validators.minLength(10)]],
      stakeholderName: [''],
      stakeholderEmail: ['', [Validators.required, Validators.email]],
    });
  }

  getControl(name: string): FormControl {
    return this.requestForm.get(name) as FormControl;
  }

  /**
   * Loads the daily limit and updates status variables.
   * @returns {Promise<void>}
   * @remarks Shows a toast message if the limit is reached.
   */
  private async loadDailyLimit(): Promise<void> {
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

  /**
   * Validates the form, sends the request, and handles the result.
   * @returns {Promise<void>}
   * @remarks Validates fields, checks the limit, sends the request, and shows success or error.
   */
  async onSubmit(): Promise<void> {
    if (this.isLimitReached) return this.showLimitToast();
    if (this.isSubmitting) return;

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.submitError = 'Please fill out all required fields correctly.';
      this.toastService.showError('Please fill out all required fields correctly.');
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;
    try {
      const response = await this.sendRequest();
      await this.handleSuccess();
    } catch (error: any) {
      this.handleSubmitError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Shows a toast message if the daily limit is reached.
   * @returns {void}
   * @remarks Called when no further requests are allowed.
   */
  private showLimitToast(): void {
    this.toastService.showDailyLimitReached(this.maxRequests);
  }

  /**
   * Sends the request to the n8n webhook.
   * @returns {Promise<any>} The webhook response.
   * @remarks Builds the request object and sends it via POST.
   */
  private async sendRequest(): Promise<any> {
    const formValue = this.requestForm.value;
    const stakeholderEmail = String(formValue.stakeholderEmail || '').trim();
    const stakeholderName = String(formValue.stakeholderName || '').trim();

    return await this.http.post<any>(environment.n8nWebhookUrl, {
      type: formValue.requestType,
      title: String(formValue.requestTitle || '').trim(),
      description: String(formValue.requestDescription || '').trim(),
      userEmail: stakeholderEmail,
      userName: stakeholderName || stakeholderEmail.split('@')[0],
      timestamp: new Date().toISOString()
    }).toPromise();
  }

  /**
   * Handles success after sending the request.
   * @returns {Promise<void>}
   * @remarks Shows a success toast, resets the form, and navigates to login.
   */
  private async handleSuccess(): Promise<void> {
    this.submitSuccess = true;
    await this.loadDailyLimit();
    const remaining = this.maxRequests - this.requestsUsed - 1;
    this.toastService.showRequestSuccess(Math.max(0, remaining));
    this.resetForm();
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }

  /**
   * Handles errors when sending the request.
   * @param error - The error object that occurred
   * @returns {void}
   * @remarks Shows an appropriate error toast message.
   */
  private handleSubmitError(error: any): void {
    console.error('❌ Error:', error);
    if (error.status === 429) {
      this.submitError = 'Daily limit reached. Please try again tomorrow.';
      this.toastService.showDailyLimitReached(this.maxRequests);
    } else {
      this.submitError = 'An error occurred. Please try again later.';
      this.toastService.showError('An error occurred. Please try again later.');
    }
  }

  /**
   * Resets the form to its default values.
   * @returns {void}
   * @remarks Called after successful submission or cancellation.
   */
  private resetForm(): void {
    this.requestForm.reset({
      requestType: 'feature',
      requestTitle: '',
      requestDescription: '',
      stakeholderName: '',
      stakeholderEmail: '',
    });
    this.requestForm.markAsPristine();
    this.requestForm.markAsUntouched();
  }

  onRequestTypeChange(ids: string[]) {
    const allowedTypes: Array<'feature' | 'bug' | 'question'> = ['feature', 'bug', 'question'];
    const selectedType = allowedTypes.includes(ids[0] as any) ? (ids[0] as 'feature' | 'bug' | 'question') : 'feature';
    this.requestForm.patchValue({ requestType: selectedType });
  }

  onRequestTypeBlur(): void {
    this.getControl('requestType').markAsTouched();
  }

  requestTypeHasError(): boolean {
    const control = this.getControl('requestType');
    return control.touched && control.invalid;
  }

  /**
   * Navigates back to the feature request role.
   * @returns {void}
   * @remarks Called when the "Back" button is clicked.
   */
  goBack(): void {
    this.router.navigate(['/role/feature-request']);
  }
}
