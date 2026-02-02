import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ClickOutsideDirective, StopPropagationDirective } from "../../../../shared/directives";
import { getInitials } from '../../../../shared/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  [key: string]: any;
}

@Component({
  selector: "app-dropdown",
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideDirective, StopPropagationDirective],
  templateUrl: "./dropdown.component.html",
  styleUrl: "./dropdown.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DropdownComponent {
  id = input.required<string>();
  items = input.required<DropdownItem[]>();
  
  showClearButton = input<boolean>(true);
  selectedIds = input<string[]>([]);
  placeholder = input<string>("Select an option");
  searchable = input<boolean>(true);
  multiple = input<boolean>(false);
  disabled = input<boolean>(false);
  searchPlaceholder = input<string>("Search...");
  maxHeight = input<string>("300px");

  selectionChange = output<string[]>();
  opened = output<void>();
  closed = output<void>();

  isOpen = signal<boolean>(false);
  searchQuery = signal<string>("");
  focusedIndex = signal<number>(-1);


  /**
   * Items filtered by search query
   * @return {DropdownItem[]} Filtered items array  
   * @remarks Case-insensitive filtering based on label matching search query
   */
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.items();

    return this.items().filter((item) =>
      item.label.toLowerCase().includes(query),
    );
  });

  /**
   * Currently selected items as full objects
   * @return {DropdownItem[]} Selected items array
   * @remarks Maps selected IDs to full item objects from items list
   */
  selectedItems = computed(() => {
    const ids = this.selectedIds();
    return this.items().filter((item) => ids.includes(item.id));
  });

  /**
   * Display text for the trigger button
   * @return {string} Display text
   * @remarks Shows placeholder if no selection, single label if one selected,
   * or count if multiple selected
   */
  displayText = computed(() => {
    const selected = this.selectedItems();
    if (selected.length === 0) return this.placeholder();
    if (selected.length === 1) return selected[0].label;
    return `${selected.length} selected`;
  });

  /**
   * Checks if an item is selected by ID
   * @return {(itemId: string) => boolean} Function to check selection by item ID
   * @remarks Used for applying selected styles in the template
   */
  isSelected = computed(() => {
    const ids = this.selectedIds();
    return (itemId: string) => ids.includes(itemId);
  });

  hasSelection = computed(() => this.selectedIds().length > 0);
  ariaExpanded = computed(() => this.isOpen());

  ariaActiveDescendant = computed(() => {
    const index = this.focusedIndex();
    if (index === -1) return undefined;
    const item = this.filteredItems()[index];
    return item ? `${this.id()}-item-${item.id}` : undefined;
  });

  /**
   * Constructor sets up effect to reset focused index on items or search change
   * @remarks Ensures focused index is valid when dropdown content changes
   */
  constructor() {
    effect(() => {
      this.filteredItems();
      this.focusedIndex.set(-1);
    });
  }

  /**
   * Toggles dropdown open/close state and emits events
   * @remarks Prevents toggling if disabled
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
   * @remarks Prevents opening if disabled
   */
  openDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.searchQuery.set("");
    this.focusedIndex.set(-1);
    this.opened.emit();
  }

  /**
   * Close dropdown
   * @remarks Resets search and focused index on close
   */
  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set("");
    this.focusedIndex.set(-1);
    this.closed.emit();
  }

  /**
   * Handles item selection in single/multi-select modes
   * @param item - The item to select
   * @remarks Toggles selection in multi-select, replaces in single-select
   */
  selectItem(item: DropdownItem): void {
    if (item.disabled) return;

    const currentIds = [...this.selectedIds()];

    if (this.multiple()) {
      const index = currentIds.indexOf(item.id);
      if (index > -1) {
        currentIds.splice(index, 1);
      } else {
        currentIds.push(item.id);
      }
      this.selectionChange.emit(currentIds);
    } else {
      this.selectionChange.emit([item.id]);
      this.closeDropdown();
    }
  }

  /**
   * Clears all selections
   * @param event - Optional click event
   * @remarks Stops propagation to prevent dropdown toggle
   */
  clearSelection(event?: Event): void {
    event?.stopPropagation();
    this.selectionChange.emit([]);
  }

  /**
   * Handles keyboard navigation and selection
   * @param event - Keyboard event
   * @remarks Supports Arrow keys, Enter, Escape, Home, End for accessibility
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return this.handleClosedKey(event);
    const items = this.filteredItems();
    const idx = this.focusedIndex();
    switch (event.key) {
      case "ArrowDown": return this.navigate(idx + 1, items.length - 1, event);
      case "ArrowUp": return this.navigate(idx - 1, 0, event);
      case "Enter": return this.handleEnter(idx, items, event);
      case "Escape": return this.handleEscape(event);
      case "Home": return this.navigate(0, 0, event);
      case "End": return this.navigate(items.length - 1, items.length - 1, event);
    }
  }

  /**
   * Handles key events when dropdown is closed and navigates accordingly
   * 
   * @param event - Keyboard event
   * @remarks Opens dropdown on Enter, Space, or ArrowDown keys
   */
  private handleClosedKey(event: KeyboardEvent) {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      this.openDropdown();
    }
  }

  /**
   * Navigates focused index within bounds 
   * 
   * @param newIdx - New index to set 
   * @param limit - Maximum index limit
   * @param event - Keyboard event
   * @remarks Prevents default scrolling behavior
   */
  private navigate(newIdx: number, limit: number, event: KeyboardEvent) {
    event.preventDefault();
    this.focusedIndex.set(Math.max(0, Math.min(newIdx, limit)));
  }

  /**
   * Handles Enter key to select focused item
   * 
   * @param idx - Focused item index
   * @param items - Filtered items array
   * @param event - Keyboard event
   * @remarks Prevents default form submission behavior
   */
  private handleEnter(idx: number, items: DropdownItem[], event: KeyboardEvent) {
    event.preventDefault();
    if (idx >= 0 && idx < items.length) this.selectItem(items[idx]);
  }

  /**
   * Handles Escape key to close dropdown
   * 
   * @param event - Keyboard event
   * @remarks Prevents default behavior 
   */
  private handleEscape(event: KeyboardEvent) {
    event.preventDefault();
    this.closeDropdown();
  }

  /**
   * Handles click outside to close dropdown
   * @remarks Closes dropdown if open
   */
  onClickOutside(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }

  /**
   * Track by function for ngFor optimization
   * @param index - Array index
   * @param item - Dropdown item
   * @returns Item ID
   * @remarks Improves performance by tracking items by unique ID
   */
  trackByItemId(index: number, item: DropdownItem): string {
    return item.id;
  }

  /**
   * Generates initials from name string
   * @param name - Full name string
   * @returns Two-letter initials
   * @remarks Handles single and multi-part names
   */
  getInitials(name: string): string {
    if (!name) return "";

    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Checks if item has color property for avatar styling
   * @param item - Dropdown item
   * @returns True if item has color
   * @remarks Used to conditionally apply avatar colors in template
   */
  hasColor(item: DropdownItem): boolean {
    return !!item["color"];
  }

  /**
   * Gets color from item with fallback
   * @param item - Dropdown item
   * @returns Color hex code
   * @remarks Used for avatar background colors in template
   */
  getColor(item: DropdownItem): string {
    return item["color"] || "#29ABE2";
  }
}
