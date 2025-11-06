import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  effect,
  OnInit
} from '@angular/core';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DropdownConfig, QuestionData, ResponseValue, ValidationStates } from "../../typees/question-types";

interface TemplatePart {
  htmlContent: string;
  dropdownConfig?: DropdownConfig;
  dropdownIndex?: number;
  isLastPart: boolean;
}

@Component({
  selector: 'app-template-renderer',
  standalone: true,
  imports: [DropdownComponent],
  providers: [],
  template: `
    <div class="template-renderer">
      @for (part of templateParts(); track $index) {
        <span [innerHTML]="part.htmlContent"></span>

        @if (!part.isLastPart && part.dropdownConfig && part.dropdownIndex !== undefined) {
          <app-dropdown
            [value]="getDropdownValue(part.dropdownIndex)"
            [options]="part.dropdownConfig.options"
            [placeholder]="part.dropdownConfig.placeholder || '?'"
            [isDisabled]="isDisabled"
            [validationState]="getValidationState(part.dropdownIndex)"
            (valueChange)="onDropdownChange($event, part.dropdownIndex)"
          />
        }
      }
    </div>
  `,
  styles: [`
    .template-renderer {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
    }
    
    .template-renderer span {
      display: inline;
    }
    
    .template-renderer p {
      margin: 0;
      display: inline;
    }
    
    .template-renderer strong {
      font-weight: 600;
    }
    
    .template-renderer em {
      font-style: italic;
    }
  `]
})
export class TemplateRendererComponent implements OnInit {
  @Input() template: string = '';
  @Input() question!: QuestionData;
  @Input() responseValue: ResponseValue = {};
  @Input() isDisabled: boolean = false;
  @Input() validationStates: ValidationStates = {};

  @Output() dropdownChange = new EventEmitter<ResponseValue>();

  currentResponse = signal<ResponseValue>({});
  templateParts = signal<TemplatePart[]>([]);

  constructor() {}

  ngOnInit() {
    this.parseTemplate(this.template, this.question);
    this.currentResponse.set({ ...this.responseValue });
  }

  private parseTemplate(templateStr: string, questionData: QuestionData): void {
    if (!templateStr) {
      this.templateParts.set([]);
      return;
    }

    const parts = templateStr.split('{{dropdown}}');
    const dropdownConfigs = questionData?.dropdown_configs || [];

    const parsedParts = parts.map((htmlPart, index) => {
      const isLastPart = index === parts.length - 1;
      const templatePart: TemplatePart = {
        htmlContent: this.sanitizeHtml(htmlPart),
        isLastPart
      };

      if (!isLastPart) {
        templatePart.dropdownConfig = dropdownConfigs[index] || {
          placeholder: '?',
          options: []
        };
        templatePart.dropdownIndex = index;
      }

      return templatePart;
    });

    this.templateParts.set(parsedParts);
  }

  private sanitizeHtml(html: string): string {
    // Simple HTML sanitization - remove potentially dangerous content
    if (typeof html !== 'string') {
      return '';
    }
    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, '');
  }

  onDropdownChange(value: string, index: number): void {
    const updatedResponse = {
      ...this.currentResponse(),
      [index]: value
    };
    this.currentResponse.set(updatedResponse);
    this.dropdownChange.emit(updatedResponse);
  }

  getDropdownValue(index: number): string | undefined {
    return this.currentResponse()[index];
  }

  getValidationState(index: number): 'correct' | 'incorrect' | null {
    return this.validationStates[index] || null;
  }
}
