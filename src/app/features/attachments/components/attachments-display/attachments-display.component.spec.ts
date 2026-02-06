import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskAttachmentsDisplayComponent } from './task-attachments-display.component';

describe('TaskAttachmentsDisplayComponent', () => {
  let component: TaskAttachmentsDisplayComponent;
  let fixture: ComponentFixture<TaskAttachmentsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAttachmentsDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskAttachmentsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
