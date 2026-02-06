import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachmentsDisplayComponent } from './attachments-display.component';

describe('AttachmentsDisplayComponent', () => {
  let component: AttachmentsDisplayComponent;
  let fixture: ComponentFixture<AttachmentsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentsDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AttachmentsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
