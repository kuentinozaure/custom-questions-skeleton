import "@angular/compiler";

import {
  Component,
  HostListener,
  ElementRef,
  signal,
  input,
  output,
  computed,
  inject,
  Input,
} from "@angular/core";

@Component({
  selector: "app-dropdown",
  standalone: true,
  template: `
    <div class="dropdown-container" [class]="validationClass()">
      <button
        class="dropdown-trigger"
        [class.has-value]="value !== undefined"
        [disabled]="isDisabled"
        (click)="toggleDropdown()"
        type="button"
      >
        {{ displayValue() }}
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
  styles: [
    `
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

        &:hover:not(:disabled) {
          border-color: #999;
          background-color: #f8f8f8;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          background-color: #f5f5f5;
        }

        &.has-value {
          font-weight: 500;
        }

        &::after {
          content: "▼";
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: #666;
        }
      }

      .dropdown-options {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: row;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 220px;
        padding: 8px;
        margin: 0;
        list-style: none;
        gap: 4px;
      }

      .dropdown-option {
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.15s ease;
        white-space: nowrap;
        font-size: 14px;

        &:hover {
          background-color: #f0f0f0;
        }

        &.selected {
          background-color: #e3f2fd;
          font-weight: 500;
          color: #1976d2;
        }
      }

      .dropdown-correct {
        .dropdown-trigger {
          border-color: #4caf50;
          background-color: #e8f5e9;
        }
      }

      .dropdown-incorrect {
        .dropdown-trigger {
          border-color: #f44336;
          background-color: #ffebee;
        }
      }
    `,
  ],
})
export class DropdownComponent {
  @Input() value: string | undefined = undefined;
  @Input() options: string[] = [];
  @Input() placeholder: string = "?";
  @Input() isDisabled: boolean = false;
  @Input() validationState: "correct" | "incorrect" | null = null;

  valueChange = output<string>();

  isOpen = signal(false);

  private elementRef: ElementRef = inject(ElementRef);

  displayValue = computed(() => {
    const val = this.value;
    return val !== undefined ? val : this.placeholder;
  });

  validationClass = computed(() => {
    const state = this.validationState;
    if (state === "correct") return "dropdown-correct";
    if (state === "incorrect") return "dropdown-incorrect";
    return "";
  });

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

  @HostListener("document:mousedown", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  isSelected(option: string): boolean {
    return this.value === option;
  }
}
