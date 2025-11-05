import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from "@angular/core";
import { DropdownComponent } from "../dropdown/dropdown.component";
import {
  DropdownConfig,
  QuestionData,
  ResponseValue,
  ValidationStates,
} from "../../typees/question-types";

interface TemplatePart {
  htmlContent: string;
  dropdownConfig?: DropdownConfig;
  dropdownIndex?: number;
  isLastPart: boolean;
}

@Component({
  selector: "app-template-renderer",
  standalone: true,
  imports: [DropdownComponent],
  template: `
    <div class="template-renderer">
      @for (part of templateParts(); track $index) {
      <span [innerHTML]="part.htmlContent"></span>

      @if (!part.isLastPart && part.dropdownConfig && part.dropdownIndex !==
      undefined) {
      <app-dropdown
        [value]="getDropdownValue(part.dropdownIndex)"
        [options]="part.dropdownConfig.options"
        [placeholder]="part.dropdownConfig.placeholder || '?'"
        [isDisabled]="isDisabled"
        [validationState]="getValidationState(part.dropdownIndex)"
        (valueChange)="onDropdownChange($event, part.dropdownIndex)"
      />
      } }
    </div>
  `,
  styles: [
    `
      .template-renderer {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
      }

      .template-renderer span {
        display: inline;
      }

      :host ::ng-deep p {
        margin: 0;
        display: inline;
      }

      :host ::ng-deep strong {
        font-weight: 600;
      }

      :host ::ng-deep em {
        font-style: italic;
      }
    `,
  ],
})
export class TemplateRendererComponent implements OnInit, OnChanges {
  @Input() template: string = "";
  @Input() question!: QuestionData;
  @Input() responseValue: ResponseValue = {};
  @Input() isDisabled: boolean = false;
  @Input() validationStates: ValidationStates = {};

  @Output() dropdownChange = new EventEmitter<ResponseValue>();

  currentResponse = signal<ResponseValue>({});
  templateParts = signal<TemplatePart[]>([]);

  constructor() {
    // Initialize signals with default values
    this.currentResponse.set(this.responseValue);
  }

  ngOnInit() {
    // Parse template when component initializes
    this.parseTemplate(this.template, this.question);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update signals when inputs change
    if (changes["responseValue"]) {
      this.currentResponse.set({ ...this.responseValue });
    }

    if (changes["template"] || changes["question"]) {
      this.parseTemplate(this.template, this.question);
    }
  }

  private parseTemplate(templateStr: string, questionData: QuestionData): void {
    if (!templateStr) {
      this.templateParts.set([]);
      return;
    }

    const parts = templateStr.split("{{dropdown}}");
    const dropdownConfigs = questionData?.dropdown_configs || [];

    const parsedParts = parts.map((htmlPart, index) => {
      const isLastPart = index === parts.length - 1;
      const templatePart: TemplatePart = {
        htmlContent: this.sanitizeHtml(htmlPart),
        isLastPart,
      };

      if (!isLastPart) {
        templatePart.dropdownConfig = dropdownConfigs[index] || {
          placeholder: "?",
          options: [],
        };
        templatePart.dropdownIndex = index;
      }

      return templatePart;
    });

    this.templateParts.set(parsedParts);
  }

  private sanitizeHtml(html: string): string {
    // Simple sanitization - in production you'd want proper HTML sanitization
    return html || "";
  }

  onDropdownChange(value: string, index: number): void {
    const updatedResponse = {
      ...this.currentResponse(),
      [index]: value,
    };
    this.currentResponse.set(updatedResponse);
    this.dropdownChange.emit(updatedResponse);
  }

  getDropdownValue(index: number): string | undefined {
    return this.currentResponse()[index];
  }

  getValidationState(index: number): "correct" | "incorrect" | null {
    return this.validationStates[index] || null;
  }
}
