import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmailMaskComponent } from './email-mask.component';

describe('EmailMaskComponent', () => {
  let component: EmailMaskComponent;
  let fixture: ComponentFixture<EmailMaskComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        EmailMaskComponent,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailMaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.requestForm.get('requestType')?.value).toBe('feature');
    expect(component.requestForm.get('title')?.value).toBe('');
    expect(component.requestForm.get('description')?.value).toBe('');
    expect(component.requestForm.get('userName')?.value).toBe('');
    expect(component.requestForm.get('userEmail')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const form = component.requestForm;
    expect(form.valid).toBeFalsy();

    form.patchValue({
      title: 'Test Title',
      description: 'Test Description that is long enough',
      userEmail: 'test@example.com'
    });

    expect(form.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.requestForm.get('userEmail');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/feature-request']);
  });

  it('should display error messages for invalid fields', () => {
    const titleControl = component.requestForm.get('title');
    titleControl?.markAsTouched();

    expect(component.hasError('title')).toBeTruthy();
    expect(component.getErrorMessage('title')).toContain('required');
  });
});
