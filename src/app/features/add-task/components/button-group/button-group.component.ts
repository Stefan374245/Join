import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interface für Button-Konfiguration
 */
export interface ButtonConfig {
  value: string | number;
  label: string;
  cssClass?: string;
  ariaLabel?: string;
  disabled?: boolean;
  iconLeft?: string;
  iconLeftActive?: string;
  iconLeftAlt?: string;
  iconRight?: string;
  iconRightActive?: string;
  iconRightAlt?: string;
}

/**
 * Generischer ButtonGroupComponent
 * 
 * Ersetzt:
 * - PrioritySelectorComponent
 * - TabNavigationComponent
 * - FilterButtonsComponent
 * - ToggleGroupComponent
 * 
 * Features:
 * - Gruppe von Toggle-Buttons (nur einer kann aktiv sein)
 * - Konfigurierbar via ButtonConfig Interface
 * - Icons optional (left/right)
 * - Active/Inactive States mit Icon-Tausch
 * - Disabled State
 * - Accessibility (ARIA, keyboard nav)
 * 
 * @example
 * // Priority Buttons
 * <app-button-group
 *   label="Priority"
 *   ariaLabel="Select task priority"
 *   [selectedValue]="selectedPriority()"
 *   [buttons]="priorityButtons"
 *   (valueChange)="selectPriority($event)"
 * />
 * 
 * @example
 * // Tab Navigation
 * <app-button-group
 *   ariaLabel="View selection"
 *   [selectedValue]="currentView()"
 *   [buttons]="viewButtons"
 *   [showIcons]="false"
 *   (valueChange)="changeView($event)"
 * />
 */
@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-group.component.html',
  styleUrl: './button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupComponent {
  // Inputs
  label = input<string>('');
  ariaLabel = input<string>('Button group');
  buttons = input.required<ButtonConfig[]>();
  selectedValue = input<string | number | null>(null);
  showIcons = input<boolean>(true);
  
  // Output
  valueChange = output<string | number>();
  
  // Computed
  hasLabel = computed(() => this.label().trim().length > 0);
  
  // Methods
  selectButton(button: ButtonConfig): void {
    if (!button.disabled) {
      this.valueChange.emit(button.value);
    }
  }
  
  isSelected(value: string | number): boolean {
    return this.selectedValue() === value;
  }
  
  getButtonClasses(button: ButtonConfig): string {
    const classes = ['button-group-item'];
    
    if (button.cssClass) {
      classes.push(button.cssClass);
    }
    
    if (this.isSelected(button.value)) {
      classes.push('active');
    }
    
    return classes.join(' ');
  }
  
  getIconPath(button: ButtonConfig, position: 'left' | 'right'): string {
    const isActive = this.isSelected(button.value);
    
    if (position === 'left') {
      const icon = isActive && button.iconLeftActive 
        ? button.iconLeftActive 
        : button.iconLeft;
      return icon || '';
    } else {
      const icon = isActive && button.iconRightActive 
        ? button.iconRightActive 
        : button.iconRight;
      return icon || '';
    }
  }
  
  hasIcon(button: ButtonConfig, position: 'left' | 'right'): boolean {
    if (!this.showIcons()) return false;
    
    return position === 'left' 
      ? !!(button.iconLeft || button.iconLeftActive)
      : !!(button.iconRight || button.iconRightActive);
  }
  
  trackBy(index: number, button: ButtonConfig): string | number {
    return button.value;
  }
}
