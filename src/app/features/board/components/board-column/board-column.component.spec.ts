import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardColumnComponent } from './board-column.component';

describe('BoardColumnComponent', () => {
  let component: BoardColumnComponent;
  let fixture: ComponentFixture<BoardColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardColumnComponent);
    component = fixture.componentInstance;
    
    // Mock required inputs
    component.columnId = 'test';
    component.title = 'Test Column';
    component.tasks = [];
    component.contacts = [];
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
