import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureRequestComponent } from './feature-request.component';

describe('FeatureRequestComponent', () => {
  let component: FeatureRequestComponent;
  let fixture: ComponentFixture<FeatureRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
