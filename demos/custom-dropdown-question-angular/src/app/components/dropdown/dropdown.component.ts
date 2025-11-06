import {
  Component,
  HostListener,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit
} from '@angular/core';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  template: `
    <div class="dropdown-container" [class]="validationClass">
      <button
        class="dropdown-trigger"
        [class.has-value]="value !== undefined"
        [disabled]="isDisabled"
        (click)="toggleDropdown()"
        type="button"
      >
        {{ displayValue }}
      </button>

      @if (isOpen()) {
        <ul class="dropdown-options">
          @for (option of options; track option) {
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
export class DropdownComponent implements OnInit {
  @Input() value: string | undefined = undefined;
  @Input() options: string[] = [];
  @Input() placeholder: string = '?';
  @Input() isDisabled: boolean = false;
  @Input() validationState: 'correct' | 'incorrect' | null = null;

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);

  ngOnInit() {
    // Initialization logic if needed
  }

  get displayValue(): string {
    return this.value !== undefined ? this.value : this.placeholder;
  }

  get validationClass(): string {
    if (this.validationState === 'correct') return 'dropdown-correct';
    if (this.validationState === 'incorrect') return 'dropdown-incorrect';
    return '';
  }

  constructor() {}

  toggleDropdown(): void {
    if (!this.isDisabled) {
      this.isOpen.set(!this.isOpen());
    }
  }

  selectOption(option: string): void {
    this.valueChange.emit(option);
    this.isOpen.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Simple approach: close dropdown on any outside click
    // More sophisticated approach would need a template reference
    const target = event.target as HTMLElement;
    if (target && !target.closest('.dropdown-container')) {
      this.isOpen.set(false);
    }
  }

  isSelected(option: string): boolean {
    return this.value === option;
  }
}
