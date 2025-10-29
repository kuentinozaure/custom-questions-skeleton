import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DropdownComponent } from '../dropdown/dropdown.component';

interface DropdownConfig {
  placeholder?: string;
  options: string[];
}

interface QuestionData {
  custom_dropdown_template: string;
  dropdown_configs?: DropdownConfig[];
  [key: string]: any;
}


interface ResponseValue {
  [index: string]: string;
}


interface ValidationStates {
  [index: string]: 'correct' | 'incorrect' | null;
}

interface TemplatePart {
  htmlContent: SafeHtml;
  dropdownConfig?: DropdownConfig;
  dropdownIndex?: number;
  isLastPart: boolean;
}

@Component({
  selector: 'app-template-renderer',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './template-renderer.component.html',
  styleUrls: ['./template-renderer.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TemplateRendererComponent implements OnInit, OnChanges {
  @Input() template: string = '';
  @Input() question!: QuestionData;
  @Input() responseValue: ResponseValue = {};
  @Input() isDisabled: boolean = false;
  @Input() validationStates: ValidationStates = {};

  @Output() dropdownChange = new EventEmitter<ResponseValue>();

  templateParts: TemplatePart[] = [];
  currentResponse: ResponseValue = {};

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.currentResponse = { ...this.responseValue };
    this.parseTemplate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template'] || changes['question']) {
      this.parseTemplate();
    }
    if (changes['responseValue']) {
      this.currentResponse = { ...this.responseValue };
    }
  }

  /**
   * Parse the template string and create template parts
   * Splits by {{dropdown}} tokens and associates each with its config
   */
  private parseTemplate(): void {
    if (!this.template) {
      this.templateParts = [];
      return;
    }

    const parts = this.template.split('{{dropdown}}');
    const dropdownConfigs = this.question?.dropdown_configs || [];

    this.templateParts = parts.map((htmlPart, index) => {
      const isLastPart = index === parts.length - 1;
      const templatePart: TemplatePart = {
        htmlContent: this.sanitizeHtml(htmlPart),
        isLastPart
      };

      // Add dropdown config if this is not the last part
      if (!isLastPart) {
        templatePart.dropdownConfig = dropdownConfigs[index] || {
          placeholder: '?',
          options: []
        };
        templatePart.dropdownIndex = index;
      }

      return templatePart;
    });
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param html - Raw HTML string
   * @returns Sanitized HTML safe for rendering
   */
  private sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }

  /**
   * Handle dropdown value change
   * @param value - The new selected value
   * @param index - The dropdown index
   */
  onDropdownChange(value: string, index: number): void {
    const updatedResponse = {
      ...this.currentResponse,
      [index]: value
    };
    this.currentResponse = updatedResponse;
    this.dropdownChange.emit(updatedResponse);
  }

  /**
   * Get the current value for a dropdown at a given index
   * @param index - The dropdown index
   */
  getDropdownValue(index: number): string | undefined {
    return this.currentResponse[index];
  }

  /**
   * Get the validation state for a dropdown at a given index
   * @param index - The dropdown index
   */
  getValidationState(index: number): 'correct' | 'incorrect' | null {
    return this.validationStates[index] || null;
  }
}
