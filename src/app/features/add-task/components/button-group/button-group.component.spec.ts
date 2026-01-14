import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonGroupComponent, ButtonConfig } from './button-group.component';

describe('ButtonGroupComponent', () => {
  let component: ButtonGroupComponent;
  let fixture: ComponentFixture<ButtonGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGroupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonGroupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit valueChange when button is clicked', () => {
    const buttons: ButtonConfig[] = [
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' }
    ];
    
    const emitSpy = jasmine.createSpy('valueChange');
    component.valueChange.subscribe(emitSpy);
    
    fixture.componentRef.setInput('buttons', buttons);
    fixture.detectChanges();

    component.selectButton(buttons[0]);

    expect(emitSpy).toHaveBeenCalledWith('high');
  });

  it('should not emit valueChange when disabled button is clicked', () => {
    const buttons: ButtonConfig[] = [
      { value: 'high', label: 'High', disabled: true }
    ];
    
    const emitSpy = jasmine.createSpy('valueChange');
    component.valueChange.subscribe(emitSpy);
    
    fixture.componentRef.setInput('buttons', buttons);
    fixture.detectChanges();

    component.selectButton(buttons[0]);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should correctly identify selected button', () => {
    fixture.componentRef.setInput('selectedValue', 'medium');
    fixture.detectChanges();

    expect(component.isSelected('medium')).toBe(true);
    expect(component.isSelected('high')).toBe(false);
  });

  it('should apply active class to selected button', () => {
    const buttons: ButtonConfig[] = [
      { value: 'high', label: 'High', cssClass: 'priority-btn priority-btn-urgent' },
      { value: 'medium', label: 'Medium', cssClass: 'priority-btn priority-btn-medium' }
    ];
    
    fixture.componentRef.setInput('buttons', buttons);
    fixture.componentRef.setInput('selectedValue', 'high');
    fixture.detectChanges();

    const classes = component.getButtonClasses(buttons[0]);
    expect(classes).toContain('active');
    expect(classes).toContain('priority-btn-urgent');
  });

  it('should return correct icon path for active button', () => {
    const button: ButtonConfig = {
      value: 'high',
      label: 'Urgent',
      iconRight: 'assets/images/urgent.svg',
      iconRightActive: 'assets/images/urgentwhite.svg'
    };
    
    fixture.componentRef.setInput('selectedValue', 'high');
    fixture.detectChanges();

    expect(component.getIconPath(button, 'right')).toBe('assets/images/urgentwhite.svg');
  });

  it('should return correct icon path for inactive button', () => {
    const button: ButtonConfig = {
      value: 'high',
      label: 'Urgent',
      iconRight: 'assets/images/urgent.svg',
      iconRightActive: 'assets/images/urgentwhite.svg'
    };
    
    fixture.componentRef.setInput('selectedValue', 'low');
    fixture.detectChanges();

    expect(component.getIconPath(button, 'right')).toBe('assets/images/urgent.svg');
  });

  it('should hide icons when showIcons is false', () => {
    const button: ButtonConfig = {
      value: 'high',
      label: 'High',
      iconRight: 'assets/images/urgent.svg'
    };
    
    fixture.componentRef.setInput('showIcons', false);
    fixture.detectChanges();

    expect(component.hasIcon(button, 'right')).toBe(false);
  });

  it('should show label when provided', () => {
    fixture.componentRef.setInput('label', 'Priority');
    fixture.detectChanges();

    expect(component.hasLabel()).toBe(true);
  });

  it('should hide label when empty', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();

    expect(component.hasLabel()).toBe(false);
  });
});
