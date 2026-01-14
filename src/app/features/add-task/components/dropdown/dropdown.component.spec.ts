import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent, DropdownItem } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent;
  let fixture: ComponentFixture<DropdownComponent>;
  let testItems: DropdownItem[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    component = fixture.componentInstance;
    
    // Setup test data
    testItems = [
      { id: '1', label: 'Option 1' },
      { id: '2', label: 'Option 2' },
      { id: '3', label: 'Option 3', disabled: true },
      { id: '4', label: 'Another Option' }
    ];
  });

  // ============================================
  // CREATION & INITIALIZATION
  // ============================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with required inputs', () => {
    fixture.componentRef.setInput('id', 'test-dropdown');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger).toBeTruthy();
  });

  // ============================================
  // DROPDOWN STATE
  // ============================================

  it('should be closed by default', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    const menu = fixture.nativeElement.querySelector('.dropdown-menu');
    expect(menu).toBeFalsy();
  });

  it('should open dropdown when trigger is clicked', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const menu = fixture.nativeElement.querySelector('.dropdown-menu');
    expect(menu).toBeTruthy();
  });

  it('should close dropdown when trigger is clicked again', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('should emit opened event when dropdown opens', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    
    let emitted = false;
    component.opened.subscribe(() => emitted = true);
    
    component.openDropdown();
    expect(emitted).toBe(true);
  });

  it('should emit closed event when dropdown closes', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    
    let emitted = false;
    component.closed.subscribe(() => emitted = true);
    
    component.closeDropdown();
    expect(emitted).toBe(true);
  });

  // ============================================
  // SINGLE SELECT MODE
  // ============================================

  it('should select item in single-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    component.selectItem(testItems[0]);
    expect(selectedIds).toEqual(['1']);
  });

  it('should close dropdown after selection in single-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('multiple', false);
    component.isOpen.set(true);
    fixture.detectChanges();

    component.selectItem(testItems[0]);
    expect(component.isOpen()).toBe(false);
  });

  it('should replace selection in single-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('selectedIds', ['1']);
    fixture.componentRef.setInput('multiple', false);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    component.selectItem(testItems[1]);
    expect(selectedIds).toEqual(['2']);
  });

  // ============================================
  // MULTI SELECT MODE
  // ============================================

  it('should allow multiple selections in multi-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    component.selectItem(testItems[0]);
    expect(selectedIds).toEqual(['1']);

    component.selectItem(testItems[1]);
    expect(selectedIds).toEqual(['1', '2']);
  });

  it('should deselect item when clicked again in multi-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('selectedIds', ['1', '2']);
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    component.selectItem(testItems[0]);
    expect(selectedIds).toEqual(['2']);
  });

  it('should not close dropdown after selection in multi-select mode', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('multiple', true);
    component.isOpen.set(true);
    fixture.detectChanges();

    component.selectItem(testItems[0]);
    expect(component.isOpen()).toBe(true);
  });

  // ============================================
  // DISABLED STATE
  // ============================================

  it('should not select disabled items', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    let emitted = false;
    component.selectionChange.subscribe(() => emitted = true);

    component.selectItem(testItems[2]); // disabled item
    expect(emitted).toBe(false);
  });

  it('should not open when dropdown is disabled', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.toggleDropdown();
    expect(component.isOpen()).toBe(false);
  });

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  it('should filter items based on search query', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    component.searchQuery.set('Another');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].id).toBe('4');
  });

  it('should be case-insensitive when filtering', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    component.searchQuery.set('OPTION');
    expect(component.filteredItems().length).toBe(3);
  });

  it('should show all items when search is empty', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    component.searchQuery.set('');
    expect(component.filteredItems().length).toBe(testItems.length);
  });

  // ============================================
  // DISPLAY TEXT
  // ============================================

  it('should show placeholder when nothing is selected', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('placeholder', 'Select item');
    fixture.detectChanges();

    expect(component.displayText()).toBe('Select item');
  });

  it('should show item label when one item is selected', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('selectedIds', ['1']);
    fixture.detectChanges();

    expect(component.displayText()).toBe('Option 1');
  });

  it('should show count when multiple items are selected', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('selectedIds', ['1', '2']);
    fixture.detectChanges();

    expect(component.displayText()).toBe('2 selected');
  });

  // ============================================
  // CLEAR SELECTION
  // ============================================

  it('should clear all selections', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('selectedIds', ['1', '2']);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    component.clearSelection();
    expect(selectedIds).toEqual([]);
  });

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  it('should open dropdown on ArrowDown key', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeyDown(event);
    expect(component.isOpen()).toBe(true);
  });

  it('should navigate down through items with ArrowDown', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeyDown(event);
    expect(component.focusedIndex()).toBe(0);

    component.onKeyDown(event);
    expect(component.focusedIndex()).toBe(1);
  });

  it('should navigate up through items with ArrowUp', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    component.focusedIndex.set(2);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.onKeyDown(event);
    expect(component.focusedIndex()).toBe(1);
  });

  it('should select focused item on Enter key', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    component.focusedIndex.set(1);
    fixture.detectChanges();

    let selectedIds: string[] = [];
    component.selectionChange.subscribe(ids => selectedIds = ids);

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(event);
    expect(selectedIds).toEqual(['2']);
  });

  it('should close dropdown on Escape key', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeyDown(event);
    expect(component.isOpen()).toBe(false);
  });

  // ============================================
  // ACCESSIBILITY
  // ============================================

  it('should have correct aria-expanded attribute', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    component.openDropdown();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('should have correct role attributes', () => {
    fixture.componentRef.setInput('id', 'test');
    fixture.componentRef.setInput('items', testItems);
    component.isOpen.set(true);
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.dropdown-list');
    expect(menu.getAttribute('role')).toBe('listbox');
  });
});
