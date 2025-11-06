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
  styles: [`
    .dropdown-container {
      display: inline-block;
      position: relative;
      vertical-align: middle;
      margin: 0 4px;
    }
    
    .dropdown-trigger {
      min-width: 60px;
      padding: 6px 28px 6px 12px;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-align: center;
      position: relative;
      transition: all 0.2s ease;
    }
    
    .dropdown-trigger:hover:not(:disabled) {
      border-color: #999;
    }
    
    .dropdown-trigger:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .dropdown-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ccc;
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .dropdown-option {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .dropdown-option:hover {
      background-color: #f0f0f0;
    }
    
    .dropdown-option.selected {
      background-color: #e6f3ff;
    }
  `]
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
