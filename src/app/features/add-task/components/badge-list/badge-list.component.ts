import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getInitials } from '../../../../shared/utils';
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
  
  displayedItems = computed(() => {
    const max = this.maxVisible();
    return max ? this.items().slice(0, max) : this.items();
  });
  
  remainingCount = computed(() => {
    const max = this.maxVisible();
    // Calculate overflow count when limit is set
    return max ? Math.max(0, this.items().length - max) : 0;
  });

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
    return item.id;
  }

  /**
   * Gets CSS classes for badge styling
   * @param item - Badge item
   * @returns CSS class string
   */
  getBadgeClasses(item: BadgeItem): string {
    return item.cssClass || '';
  }
  
  /**
   * Generates initials from label text
   * @param label - Text to generate initials from
   * @returns Two-letter initials in uppercase
   */
  getInitials = getInitials;
}
