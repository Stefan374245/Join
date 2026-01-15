import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge item interface for contact badges, category tags, skill badges
 */
export interface BadgeItem {
  id: string;
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  iconAlt?: string;
  cssClass?: string;
  ariaLabel?: string;
  nonRemovable?: boolean;
}

/**
 * Reusable badge list component with remove functionality and overflow handling
 */
@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge-list.component.html',
  styleUrl: './badge-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeListComponent {
  items = input<BadgeItem[]>([]);
  maxVisible = input<number | null>(null); // null = alle anzeigen
  removable = input<boolean>(true);
  removeIcon = input<string>('assets/images/close.svg');
  ariaLabel = input<string>('Items');
  layout = input<'horizontal' | 'vertical'>('horizontal');
  
  itemRemove = output<string>();
  
  /**
   * Items to display based on maxVisible limit
   */
  displayedItems = computed(() => {
    const max = this.maxVisible();
    // Show all items if no limit, otherwise slice to max
    return max ? this.items().slice(0, max) : this.items();
  });
  
  /**
   * Count of items not displayed due to maxVisible limit
   */
  remainingCount = computed(() => {
    const max = this.maxVisible();
    // Calculate overflow count when limit is set
    return max ? Math.max(0, this.items().length - max) : 0;
  });
  
  /**
   * Whether there are more items than displayed
   */
  hasMore = computed(() => this.remainingCount() > 0);
  
  /**
   * Emits remove event for specified item
   * @param itemId - ID of item to remove
   */
  remove(itemId: string): void {
    // Emit item ID to parent component for removal handling
    this.itemRemove.emit(itemId);
  }
  
  /**
   * TrackBy function for ngFor optimization
   * @param index - Array index
   * @param item - Badge item
   * @returns Unique identifier for tracking
   */
  trackBy(index: number, item: BadgeItem): string {
    // Use item ID for efficient DOM updates
    return item.id;
  }
  
  /**
   * Gets CSS classes for badge styling
   * @param item - Badge item
   * @returns CSS class string
   */
  getBadgeClasses(item: BadgeItem): string {
    // Return custom CSS classes or empty string
    return item.cssClass || '';
  }
  
  /**
   * Generates initials from label text
   * @param label - Text to generate initials from
   * @returns Two-letter initials in uppercase
   */
  getInitials(label: string): string {
    if (!label) return '';
    
    // Split label into words for initial extraction
    const parts = label.trim().split(' ');
    if (parts.length === 1) {
      // Single word: take first 2 characters
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    // Multiple words: first letter of first and last word
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
