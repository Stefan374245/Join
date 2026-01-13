import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    
    component.task = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      category: 'Technical Task',
      status: 'todo',
      priority: 'medium',
      assignedTo: [],
      subtasks: [],
      dueDate: new Date('2026-01-15'),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    };
    component.contacts = [];
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
