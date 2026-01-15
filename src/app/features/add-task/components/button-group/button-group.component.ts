import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Button configuration interface for toggle button groups
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
 * Generic button group component for priority selection, tabs, filters and toggles
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
  
  /**
   * Whether label should be displayed
   */
  hasLabel = computed(() => this.label().trim().length > 0);
  
  /**
   * Handles button selection and emits value change
   * @param button - Button configuration that was selected
   */
  selectButton(button: ButtonConfig): void {
    if (!button.disabled) {
      // Emit button value to parent component
      this.valueChange.emit(button.value);
    }
  }
  
  /**
   * Checks if button is currently selected
   * @param value - Button value to check
   * @returns True if button is selected
   */
  isSelected(value: string | number): boolean {
    // Compare with currently selected value
    return this.selectedValue() === value;
  }
  
  /**
   * Generates CSS classes for button styling
   * @param button - Button configuration
   * @returns Space-separated CSS classes
   */
  getButtonClasses(button: ButtonConfig): string {
    const classes = ['button-group-item'];
    
    // Add custom CSS class if provided
    if (button.cssClass) {
      classes.push(button.cssClass);
    }
    
    // Add active class if button is selected
    if (this.isSelected(button.value)) {
      classes.push('active');
    }
    
    return classes.join(' ');
  }
  
  /**
   * Gets icon path based on button state and position
   * @param button - Button configuration
   * @param position - Icon position (left or right)
   * @returns Icon path or empty string
   */
  getIconPath(button: ButtonConfig, position: 'left' | 'right'): string {
    const isActive = this.isSelected(button.value);
    
    if (position === 'left') {
      // Use active icon if button is selected and active icon exists
      const icon = isActive && button.iconLeftActive 
        ? button.iconLeftActive 
        : button.iconLeft;
      return icon || '';
    } else {
      // Same logic for right icon
      const icon = isActive && button.iconRightActive 
        ? button.iconRightActive 
        : button.iconRight;
      return icon || '';
    }
  }
  
  /**
   * Checks if button has icon at specified position
   * @param button - Button configuration
   * @param position - Icon position to check
   * @returns True if icon exists and icons are enabled
   */
  hasIcon(button: ButtonConfig, position: 'left' | 'right'): boolean {
    if (!this.showIcons()) return false;
    
    // Check if icon exists for the specified position
    return position === 'left' 
      ? !!(button.iconLeft || button.iconLeftActive)
      : !!(button.iconRight || button.iconRightActive);
  }
  
  /**
   * TrackBy function for ngFor optimization
   * @param index - Array index
   * @param button - Button configuration
   * @returns Button value for tracking
   */
  trackBy(index: number, button: ButtonConfig): string | number {
    // Use button value as unique identifier
    return button.value;
  }
}
