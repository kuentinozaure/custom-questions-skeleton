import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DropdownComponent
 *
 * A custom standalone dropdown component for selecting options.
 * Features:
 * - Click-outside detection to close dropdown
 * - Fully controlled component (value managed by parent)
 * - Keyboard-friendly
 * - Component-scoped styling
 * - Validation state support
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DropdownComponent {
  @Input() value: string | undefined;
  @Input() options: string[] = [];
  @Input() placeholder: string = '?';
  @Input() isDisabled: boolean = false;
  @Input() validationState: 'correct' | 'incorrect' | null = null;

  @Output() valueChange = new EventEmitter<string>();

  isOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  /**
   * Toggle dropdown open/close state
   */
  toggleDropdown(): void {
    if (!this.isDisabled) {
      this.isOpen = !this.isOpen;
    }
  }

  /**
   * Handle option selection
   * @param option - The selected option value
   */
  selectOption(option: string): void {
    this.value = option;
    this.valueChange.emit(option);
    this.isOpen = false;
  }

  /**
   * Close dropdown when clicking outside
   * @param event - The click event
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /**
   * Get the display value (selected value or placeholder)
   */
  get displayValue(): string {
    return this.value !== undefined ? this.value : this.placeholder;
  }

  /**
   * Check if an option is currently selected
   * @param option - The option to check
   */
  isSelected(option: string): boolean {
    return this.value === option;
  }

  /**
   * Get CSS classes for validation state
   */
  get validationClass(): string {
    if (this.validationState === 'correct') {
      return 'dropdown-correct';
    } else if (this.validationState === 'incorrect') {
      return 'dropdown-incorrect';
    }
    return '';
  }
}
