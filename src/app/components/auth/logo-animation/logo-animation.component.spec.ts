import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoAnimationComponent } from './logo-animation.component';

describe('LogoAnimationComponent', () => {
  let component: LogoAnimationComponent;
  let fixture: ComponentFixture<LogoAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoAnimationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit animationComplete after animation', (done) => {
    component.animationComplete.subscribe(() => {
      expect(component.animationState).toBe('complete');
      done();
    });
  });
});
