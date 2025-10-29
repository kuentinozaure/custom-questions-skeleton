import {
  Component,
  HostListener,
  ElementRef,
  signal,
  input,
  output,
  computed
} from '@angular/core';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  template: `
    <div class="dropdown-container" [class]="validationClass()">
      <button
        class="dropdown-trigger"
        [class.has-value]="value() !== undefined"
        [disabled]="isDisabled()"
        (click)="toggleDropdown()"
        type="button"
      >
        {{ displayValue() }}
      </button>

      @if (isOpen()) {
        <ul class="dropdown-options">
          @for (option of options(); track option) {
            <li
              class="dropdown-option"
              [class.selected]="isSelected(option)"
              (click)="selectOption(option)"
            >
              {{ option }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  value = input<string | undefined>(undefined);
  options = input<string[]>([]);
  placeholder = input<string>('?');
  isDisabled = input<boolean>(false);
  validationState = input<'correct' | 'incorrect' | null>(null);

  valueChange = output<string>();

  isOpen = signal(false);

  displayValue = computed(() => {
    const val = this.value();
    return val !== undefined ? val : this.placeholder();
  });

  validationClass = computed(() => {
    const state = this.validationState();
    if (state === 'correct') return 'dropdown-correct';
    if (state === 'incorrect') return 'dropdown-incorrect';
    return '';
  });

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    if (!this.isDisabled()) {
      this.isOpen.set(!this.isOpen());
    }
  }

  selectOption(option: string): void {
    this.valueChange.emit(option);
    this.isOpen.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  isSelected(option: string): boolean {
    return this.value() === option;
  }
}
