import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';

/**
 * Interface for dropdown items
 */
export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  [key: string]: any; // Allow additional properties
}

/**
 * Generic Dropdown Component
 * 
 * A reusable dropdown component with search, keyboard navigation, and accessibility support.
 * Used for Contacts (Assigned To) and Categories dropdowns.
 * 
 * @example
 * ```html
 * <app-dropdown
 *   [items]="contacts()"
 *   [placeholder]="'Select contact'"
 *   [searchable]="true"
 *   [multiple]="true"
 *   (selectionChange)="onContactSelect($event)">
 *   
 *   <!-- Custom item template -->
 *   <ng-template #itemTemplate let-item>
 *     <div class="contact-item">
 *       <div class="initials">{{ getInitials(item.label) }}</div>
 *       <span>{{ item.label }}</span>
 *     </div>
 *   </ng-template>
 * </app-dropdown>
 * ```
 * 
 * @features
 * - Single and multi-select modes
 * - Search/filter functionality
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Accessibility (ARIA attributes, screen reader support)
 * - Custom item templates via content projection
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
  // ============================================
  // INPUTS
  // ============================================
  
  /** Unique identifier for the dropdown */
  id = input.required<string>();
  
  /** List of items to display in dropdown */
  items = input.required<DropdownItem[]>();
  
  /** Currently selected item IDs */
  selectedIds = input<string[]>([]);
  
  /** Placeholder text when nothing is selected */
  placeholder = input<string>('Select an option');
  
  /** Enable search/filter functionality */
  searchable = input<boolean>(true);
  
  /** Allow multiple selections */
  multiple = input<boolean>(false);
  
  /** Disable the entire dropdown */
  disabled = input<boolean>(false);
  
  /** Search placeholder text */
  searchPlaceholder = input<string>('Search...');
  
  /** Maximum height of dropdown menu */
  maxHeight = input<string>('300px');
  
  // ============================================
  // OUTPUTS
  // ============================================
  
  /** Emits when selection changes */
  selectionChange = output<string[]>();
  
  /** Emits when dropdown opens */
  opened = output<void>();
  
  /** Emits when dropdown closes */
  closed = output<void>();
  
  // ============================================
  // STATE
  // ============================================
  
  /** Whether dropdown is open */
  isOpen = signal<boolean>(false);
  
  /** Current search query */
  searchQuery = signal<string>('');
  
  /** Currently focused item index (for keyboard navigation) */
  focusedIndex = signal<number>(-1);
  
  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  
  /**
   * Filtered items based on search query
   */
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.items();
    
    return this.items().filter(item => 
      item.label.toLowerCase().includes(query)
    );
  });
  
  /**
   * Selected items (full objects)
   */
  selectedItems = computed(() => {
    const ids = this.selectedIds();
    return this.items().filter(item => ids.includes(item.id));
  });
  
  /**
   * Display text in the trigger button
   */
  displayText = computed(() => {
    const selected = this.selectedItems();
    if (selected.length === 0) return this.placeholder();
    if (selected.length === 1) return selected[0].label;
    return `${selected.length} selected`;
  });
  
  /**
   * Check if an item is selected
   */
  isSelected = computed(() => {
    const ids = this.selectedIds();
    return (itemId: string) => ids.includes(itemId);
  });
  
  /**
   * Check if dropdown has any selected items
   */
  hasSelection = computed(() => this.selectedIds().length > 0);
  
  /**
   * ARIA attributes for dropdown button
   */
  ariaExpanded = computed(() => this.isOpen());
  
  ariaActiveDescendant = computed(() => {
    const index = this.focusedIndex();
    if (index === -1) return undefined;
    const item = this.filteredItems()[index];
    return item ? `${this.id()}-item-${item.id}` : undefined;
  });
  
  // ============================================
  // EFFECTS
  // ============================================
  
  constructor() {
    // Reset focused index when filtered items change
    effect(() => {
      this.filteredItems(); // Track dependency
      this.focusedIndex.set(-1);
    });
  }
  
  // ============================================
  // METHODS
  // ============================================
  
  /**
   * Toggle dropdown open/close
   */
  toggleDropdown(): void {
    if (this.disabled()) return;
    
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  
  /**
   * Open dropdown
   */
  openDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
    this.opened.emit();
  }
  
  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
    this.closed.emit();
  }
  
  /**
   * Select an item
   */
  selectItem(item: DropdownItem): void {
    if (item.disabled) return;
    
    const currentIds = [...this.selectedIds()];
    
    if (this.multiple()) {
      // Toggle selection in multi-select mode
      const index = currentIds.indexOf(item.id);
      if (index > -1) {
        currentIds.splice(index, 1);
      } else {
        currentIds.push(item.id);
      }
      this.selectionChange.emit(currentIds);
    } else {
      // Replace selection in single-select mode
      this.selectionChange.emit([item.id]);
      this.closeDropdown();
    }
  }
  
  /**
   * Clear all selections
   */
  clearSelection(event?: Event): void {
    event?.stopPropagation();
    this.selectionChange.emit([]);
  }
  
  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.openDropdown();
      }
      return;
    }
    
    const items = this.filteredItems();
    const currentIndex = this.focusedIndex();
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(Math.min(currentIndex + 1, items.length - 1));
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(Math.max(currentIndex - 1, 0));
        break;
        
      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < items.length) {
          this.selectItem(items[currentIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
        
      case 'Home':
        event.preventDefault();
        this.focusedIndex.set(0);
        break;
        
      case 'End':
        event.preventDefault();
        this.focusedIndex.set(items.length - 1);
        break;
    }
  }
  
  /**
   * Handle click outside to close dropdown
   */
  onClickOutside(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
  
  /**
   * Track by function for ngFor optimization
   */
  trackByItemId(index: number, item: DropdownItem): string {
    return item.id;
  }
  
  /**
   * Get initials from name (e.g., "John Doe" => "JD")
   */
  getInitials(name: string): string {
    if (!name) return '';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  /**
   * Check if item has color property (for contact avatars)
   */
  hasColor(item: DropdownItem): boolean {
    return !!item['color'];
  }
  
  /**
   * Get color from item
   */
  getColor(item: DropdownItem): string {
    return item['color'] || '#29ABE2';
  }
}
