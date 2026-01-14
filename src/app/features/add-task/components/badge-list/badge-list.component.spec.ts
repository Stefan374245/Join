import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeListComponent, BadgeItem } from './badge-list.component';

describe('BadgeListComponent', () => {
  let component: BadgeListComponent;
  let fixture: ComponentFixture<BadgeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all items when maxVisible is null', () => {
    const items: BadgeItem[] = [
      { id: '1', label: 'AB', color: '#FF7A00' },
      { id: '2', label: 'CD', color: '#6E52FF' },
      { id: '3', label: 'EF', color: '#1FD7C1' }
    ];
    
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('maxVisible', null);
    fixture.detectChanges();

    expect(component.displayedItems().length).toBe(3);
    expect(component.hasMore()).toBe(false);
  });

  it('should limit displayed items when maxVisible is set', () => {
    const items: BadgeItem[] = [
      { id: '1', label: 'AB', color: '#FF7A00' },
      { id: '2', label: 'CD', color: '#6E52FF' },
      { id: '3', label: 'EF', color: '#1FD7C1' },
      { id: '4', label: 'GH', color: '#FF5EB3' }
    ];
    
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('maxVisible', 2);
    fixture.detectChanges();

    expect(component.displayedItems().length).toBe(2);
    expect(component.remainingCount()).toBe(2);
    expect(component.hasMore()).toBe(true);
  });

  it('should emit itemRemove when remove is called', () => {
    const emitSpy = jasmine.createSpy('itemRemove');
    component.itemRemove.subscribe(emitSpy);

    component.remove('test-id');

    expect(emitSpy).toHaveBeenCalledWith('test-id');
  });

  it('should apply custom cssClass from BadgeItem', () => {
    const items: BadgeItem[] = [
      { id: '1', label: 'AB', color: '#FF7A00', cssClass: 'custom-class' }
    ];
    
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    expect(component.getBadgeClasses(items[0])).toBe('custom-class');
  });

  it('should track items by id', () => {
    const item: BadgeItem = { id: 'unique-id', label: 'AB', color: '#FF7A00' };
    
    expect(component.trackBy(0, item)).toBe('unique-id');
  });
});
