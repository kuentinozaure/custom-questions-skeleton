import "@angular/compiler";

import {
  Component,
  input,
  output,
  signal,
  effect,
  Inject,
  inject,
  OnChanges,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { DropdownComponent } from "../dropdown/dropdown.component";
import {
  DropdownConfig,
  QuestionData,
  ResponseValue,
  ValidationStates,
} from "../../typees/question-types";

interface TemplatePart {
  htmlContent: SafeHtml;
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
        [isDisabled]="isDisabled()"
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

        span {
          display: inline;
        }

        :host ::ng-deep {
          p {
            margin: 0;
            display: inline;
          }

          strong {
            font-weight: 600;
          }

          em {
            font-style: italic;
          }
        }
      }
    `,
  ],
})
export class TemplateRendererComponent implements OnChanges {
  template = input<string>("{{dropdown}}{{dropdown}}{{dropdown}}{{dropdown}}");
  question = input<any>(); //input<QuestionData>();
  responseValue = input<ResponseValue>({});
  isDisabled = input<boolean>(false);
  validationStates = input<ValidationStates>({});

  dropdownChange = output<ResponseValue>();

  currentResponse = signal<ResponseValue>({});
  templateParts = signal<TemplatePart[]>([]);

  sanitizer = inject(DomSanitizer);

  constructor() {
    console.log("TemplateRendererComponent initialized");
    effect(() => {
      const templateValue = this.template();
      const questionValue = this.question();
      this.parseTemplate(templateValue, questionValue);
    });

    effect(() => {
      const response = this.responseValue();
      this.currentResponse.set({ ...response });
    });
  }

  ngOnChanges(): void {
    console.log("ngOnChanges called with template:", this.template());
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

  private sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || "";
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
    return this.validationStates()[index] || null;
  }
}
