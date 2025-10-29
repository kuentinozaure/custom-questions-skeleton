# Custom Dropdown Question Angular - How It Works

## Overview

The custom-dropdown-question-angular is a Learnosity custom question type that lets authors create fill-in-the-blank style questions with dropdown selections embedded in custom HTML templates. It's built with **Angular 20** standalone components and integrates seamlessly with the Learnosity assessment platform.

## Technology Stack

- **Angular 20.0.0** - Modern standalone components architecture
- **TypeScript 5.6.0** - Type-safe development
- **RxJS 7.8.1** - Reactive programming with observables
- **Zone.js 0.15.0** - Change detection (using noop zone for performance)
- **Webpack 5** - Module bundling and build system
- **SCSS** - Styling with Sass preprocessor
- **Jest** - Unit testing framework

## Project Structure

```
custom-dropdown-question-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dropdown/
│   │   │   │   ├── dropdown.component.ts        # Standalone dropdown component
│   │   │   │   ├── dropdown.component.html      # Dropdown template
│   │   │   │   └── dropdown.component.scss      # Dropdown styles
│   │   │   └── template-renderer/
│   │   │       ├── template-renderer.component.ts   # Template parser component
│   │   │       ├── template-renderer.component.html # Renderer template
│   │   │       └── template-renderer.component.scss # Renderer styles
│   │   ├── question/
│   │   │   └── index.ts                         # Main Question controller class
│   │   ├── scorer/
│   │   │   └── index.ts                         # Server-side validation logic
│   │   └── constants.ts                         # CSS prefix constant
│   ├── styles/
│   │   ├── _variables.scss                      # SCSS variables
│   │   ├── _question.scss                       # Question-specific styles
│   │   └── main.scss                            # Main stylesheet
│   ├── question.ts                              # Question entry point (Learnosity AMD)
│   └── scorer.ts                                # Scorer entry point (Learnosity AMD)
├── dist/                                        # Build output directory
├── authoring_custom_layout.html                 # Question editor UI layout
├── question.json                                # Question type definition
├── question_editor_init_options.json            # Editor configuration schema
├── webpack.config.js                            # Build configuration
├── tsconfig.json                                # TypeScript configuration
└── package.json                                 # Dependencies and scripts
```

## How Angular is Integrated

### The Integration Pattern

Unlike typical Angular applications that bootstrap a full app module, this implementation **embeds Angular standalone components within Learnosity's custom question framework**. The Question class (vanilla TypeScript) manages the Angular component lifecycle using Angular's modern component creation APIs.

```typescript
// src/app/question/index.ts
class Question {
    private componentRef: ComponentRef<TemplateRendererComponent> | null = null;
    private appRef: ApplicationRef | null = null;

    constructor(init: InitOptions, lrnUtils: LrnUtils) {
        // Initialize question
        this.render().then(() => {
            this.registerPublicMethods();
            this.handleEvents();
            this.events.trigger('ready');
        });
    }

    async render(): Promise<void> {
        // Create DOM structure
        this.el.innerHTML = `
            <div class="${PREFIX} lrn-response-validation-wrapper">
                <div class="lrn_response_input">
                    <div class="question-rendering-container"></div>
                </div>
                <!-- validation containers -->
            </div>
        `;

        // Bootstrap Angular component using modern API
        const platform = platformBrowserDynamic();
        const moduleRef = await platform.bootstrapModule(
            class { ngDoBootstrap() {} } as any,
            { ngZone: 'noop' } // Use noop zone for better performance
        );

        this.appRef = moduleRef.injector.get(ApplicationRef);
        const injector = moduleRef.injector.get(EnvironmentInjector);

        // Create standalone component
        this.componentRef = createComponent(TemplateRendererComponent, {
            environmentInjector: injector,
            hostElement: container
        });

        // Set inputs using modern API
        this.componentRef.setInput('template', this.question.custom_dropdown_template);
        this.componentRef.setInput('question', this.question);
        this.componentRef.setInput('responseValue', this.response.value);

        // Subscribe to outputs
        this.componentRef.instance.dropdownChange.subscribe((responses) => {
            this.onValueChange(responses);
        });

        // Attach view to application
        this.appRef.attachView(this.componentRef.hostView);
        this.componentRef.changeDetectorRef.detectChanges();
    }
}
```

### Why This Approach?

1. **Learnosity Compatibility** - Works within Learnosity's AMD module system
2. **Modern Angular Architecture** - Uses standalone components (no NgModule required)
3. **Performance Optimization** - Uses noop zone for better performance
4. **Lifecycle Control** - Question class manages when Angular components mount/unmount
5. **State Management** - Question class bridges between Learnosity API and Angular components
6. **Event Integration** - Seamlessly triggers Learnosity events from Angular components

## Core Components

### 1. Question Class (`src/app/question/index.ts`)

**Role:** Main controller that bridges Learnosity and Angular

**Key Responsibilities:**
- Creates and manages Angular component lifecycle
- Handles question initialization (initial, resume, review states)
- Registers public methods for Learnosity API
- Manages validation events and UI
- Bridges data between Learnosity and Angular components

**Public API Methods:**
```typescript
disable()           // Disable all dropdowns
enable()            // Enable all dropdowns
resetResponse()     // Clear all selections
showValidationUI()  // Display correct/incorrect feedback
resetValidationUI() // Clear validation feedback
isValid()           // Check if response is correct
```

**Event Flow:**
```typescript
onValueChange(responses: { [key: string]: string }): void {
    // Update internal response object
    this.response = { value: responses };

    // Update scorer with new response
    this.scorer = new Scorer(this.question, this.response.value);

    // Trigger Learnosity 'changed' event
    this.events.trigger('changed', this.response);
}
```

**Angular Integration:**
```typescript
// Re-render component with updated options
private renderComponent(options = {}): void {
    if (!this.componentRef) return;

    const { isDisabled = false, validationStates = {} } = options;

    // Use modern setInput API
    this.componentRef.setInput('responseValue', this.response.value);
    this.componentRef.setInput('isDisabled', isDisabled);
    this.componentRef.setInput('validationStates', validationStates);

    // Manually trigger change detection
    this.componentRef.changeDetectorRef.detectChanges();
}
```

### 2. TemplateRendererComponent (`src/app/components/template-renderer/template-renderer.component.ts`)

**Role:** Parses template and embeds dropdown components

**Component Definition:**
```typescript
@Component({
  selector: 'app-template-renderer',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './template-renderer.component.html',
  styleUrls: ['./template-renderer.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TemplateRendererComponent implements OnInit, OnChanges
```

**How It Works:**

1. **Template Parsing** - Splits template string by `{{dropdown}}` tokens
2. **Component Embedding** - Creates TemplatePart objects with dropdown configs
3. **State Management** - Tracks current response in component state
4. **Change Detection** - Responds to input changes via ngOnChanges
5. **Change Handling** - Propagates dropdown changes to parent via EventEmitter

```typescript
private parseTemplate(): void {
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

onDropdownChange(value: string, index: number): void {
    const updatedResponse = {
        ...this.currentResponse,
        [index]: value
    };
    this.currentResponse = updatedResponse;
    this.dropdownChange.emit(updatedResponse);
}
```

**Template (template-renderer.component.html):**
```html
<div class="template-container">
  @for (part of templateParts; track $index) {
    <!-- Render HTML content -->
    <span [innerHTML]="part.htmlContent"></span>

    <!-- Render dropdown if not the last part -->
    @if (!part.isLastPart && part.dropdownConfig) {
      <app-dropdown
        [value]="getDropdownValue(part.dropdownIndex!)"
        [options]="part.dropdownConfig.options"
        [placeholder]="part.dropdownConfig.placeholder || '?'"
        [isDisabled]="isDisabled"
        [validationState]="getValidationState(part.dropdownIndex!)"
        (valueChange)="onDropdownChange($event, part.dropdownIndex!)"
      ></app-dropdown>
    }
  }
</div>
```

**Angular Patterns Used:**
- **Standalone Components** - No NgModule required
- **OnInit/OnChanges Lifecycle Hooks** - Managing initialization and updates
- **EventEmitter** - Output events for parent communication
- **DomSanitizer** - Secure HTML rendering
- **@for Control Flow** - Modern Angular template syntax (v17+)
- **@if Control Flow** - Conditional rendering

### 3. DropdownComponent (`src/app/components/dropdown/dropdown.component.ts`)

**Role:** Custom dropdown UI with Angular best practices

**Component Definition:**
```typescript
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DropdownComponent
```

**Features:**
- Fully controlled component (value managed by parent)
- Click-outside detection using @HostListener
- Keyboard-friendly design
- Component-scoped styling with ViewEncapsulation
- Visual feedback for selected state and validation
- Type-safe with TypeScript interfaces

```typescript
export class DropdownComponent {
  @Input() value: string | undefined;
  @Input() options: string[] = [];
  @Input() placeholder: string = '?';
  @Input() isDisabled: boolean = false;
  @Input() validationState: 'correct' | 'incorrect' | null = null;

  @Output() valueChange = new EventEmitter<string>();

  isOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    if (!this.isDisabled) {
      this.isOpen = !this.isOpen;
    }
  }

  selectOption(option: string): void {
    this.value = option;
    this.valueChange.emit(option);
    this.isOpen = false;
  }

  // Click-outside detection using @HostListener
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get validationClass(): string {
    if (this.validationState === 'correct') {
      return 'dropdown-correct';
    } else if (this.validationState === 'incorrect') {
      return 'dropdown-incorrect';
    }
    return '';
  }
}
```

**Template (dropdown.component.html):**
```html
<div class="dropdown-container" [class]="validationClass">
  <button
    class="dropdown-trigger"
    [disabled]="isDisabled"
    (click)="toggleDropdown()"
    [class.is-open]="isOpen"
  >
    {{ displayValue }}
    <span class="dropdown-arrow">▼</span>
  </button>

  @if (isOpen) {
    <div class="dropdown-options">
      @for (option of options; track option) {
        <div
          class="dropdown-option"
          [class.selected]="isSelected(option)"
          (click)="selectOption(option)"
        >
          {{ option }}
        </div>
      }
    </div>
  }
</div>
```

**Angular Patterns Used:**
- **@Input/@Output Decorators** - Component communication
- **@HostListener** - DOM event listening
- **ElementRef** - DOM access via dependency injection
- **Getters** - Computed properties
- **Property Binding** - Dynamic attributes and classes
- **Event Binding** - User interaction handling
- **@if/@for Control Flow** - Modern Angular template syntax

### 4. Scorer Class (`src/app/scorer/index.ts`)

**Role:** Server-side validation logic

**Responsibilities:**
- Validates student responses against correct answers
- Provides scoring metrics
- Returns validation state

```typescript
export default class Scorer {
    private question: any;
    private response: { [key: string]: string };

    constructor(question: any, response: { [key: string]: string } = {}) {
        this.question = question;
        this.response = response;
    }

    isValid(): boolean {
        const validResponse = this.question.valid_response || {};

        // Check if all dropdown responses match valid_response
        return Object.entries(validResponse).every(([index, value]) => {
            return this.response[index] === value;
        });
    }

    canValidateResponse(): boolean {
        return true; // Question is scorable
    }

    validateIndividualResponses() {
        // TODO: Implement individual response validation
    }

    score() {
        // TODO: Implement scoring
    }

    maxScore() {
        // TODO: Implement max score calculation
    }
}
```

## Data Model

### Question JSON Structure

```json
{
    "type": "custom",
    "custom_type": "custom_dropdown",
    "stimulus": "<p>Question prompt text</p>",
    "custom_dropdown_template": "The capital of France is {{dropdown}}. It has a population of {{dropdown}} million.",
    "dropdown_configs": [
        {
            "placeholder": "?",
            "options": ["Paris", "London", "Berlin"]
        },
        {
            "placeholder": "?",
            "options": ["2", "5", "10"]
        }
    ],
    "valid_response": {
        "0": "Paris",
        "1": "2"
    },
    "instant_feedback": true
}
```

### TypeScript Interfaces

```typescript
interface DropdownConfig {
  placeholder?: string;
  options: string[];
}

interface QuestionData {
  custom_dropdown_template: string;
  dropdown_configs?: DropdownConfig[];
  valid_response?: { [index: string]: string };
}

interface ResponseValue {
  [index: string]: string;
}

interface ValidationStates {
  [index: string]: 'correct' | 'incorrect' | null;
}
```

### Response Structure

```json
{
    "value": {
        "0": "Paris",
        "1": "2"
    }
}
```

**Key Points:**
- Template uses `{{dropdown}}` tokens as placeholders
- Each token position corresponds to an index in `dropdown_configs`
- Response object uses numeric string keys matching dropdown positions
- `valid_response` defines correct answer for each dropdown
- TypeScript provides compile-time type safety

## How Template Parsing Works

### Step-by-Step Process

**1. Template String:**
```
"The capital of France is {{dropdown}}. It has a population of {{dropdown}} million."
```

**2. Split by Token:**
```typescript
const parts = template.split('{{dropdown}}');
// Result: ["The capital of France is ", ". It has a population of ", " million."]
```

**3. Create TemplateParts:**
```typescript
this.templateParts = parts.map((htmlPart, index) => {
    const isLastPart = index === parts.length - 1;
    return {
        htmlContent: this.sanitizeHtml(htmlPart),
        dropdownConfig: !isLastPart ? dropdownConfigs[index] : undefined,
        dropdownIndex: !isLastPart ? index : undefined,
        isLastPart
    };
});
```

**4. Render in Template:**
```html
@for (part of templateParts; track $index) {
  <span [innerHTML]="part.htmlContent"></span>
  @if (!part.isLastPart) {
    <app-dropdown [config]="part.dropdownConfig" ... />
  }
}
```

### Result in Browser

```
The capital of France is [Paris ▼]. It has a population of [2 ▼] million.
```

## Complete Data Flow

```
1. AUTHORING
   ├─ Author creates question in Learnosity editor
   ├─ authoring_custom_layout.html provides custom UI
   ├─ question_editor_init_options.json defines schema
   └─ Question JSON stored in Learnosity

2. INITIALIZATION
   ├─ Learnosity loads question.ts via AMD
   ├─ Question class constructor called with init data
   ├─ Question.render() creates DOM structure
   ├─ Angular platform bootstrapped with noop zone
   ├─ TemplateRendererComponent created using createComponent()
   ├─ Component inputs set via setInput()
   └─ Component attached to ApplicationRef

3. RENDERING
   ├─ TemplateRendererComponent.ngOnInit() called
   ├─ parseTemplate() splits template by {{dropdown}}
   ├─ templateParts array created with configs
   ├─ Template renders with @for control flow
   ├─ DropdownComponents created for each token
   └─ Initial response values populated via @Input

4. INTERACTION
   ├─ Student clicks dropdown trigger button
   ├─ DropdownComponent.toggleDropdown() sets isOpen = true
   ├─ Dropdown options rendered with @if control flow
   ├─ Student clicks option
   ├─ DropdownComponent.selectOption(option) called
   ├─ valueChange.emit(option) emits to parent
   ├─ TemplateRendererComponent.onDropdownChange() updates state
   ├─ dropdownChange.emit(updatedResponse) emits to Question class
   ├─ Question.onValueChange() updates response
   └─ Learnosity 'changed' event triggered

5. VALIDATION
   ├─ Student clicks "Check Answer"
   ├─ Learnosity triggers 'validate' event
   ├─ Question.showValidationUI() called
   ├─ Scorer.isValid() checks response vs valid_response
   ├─ Validation states calculated for each dropdown
   ├─ componentRef.setInput('validationStates', states)
   ├─ Change detection triggered manually
   ├─ DropdownComponents receive validationState inputs
   ├─ CSS classes applied (dropdown-correct / dropdown-incorrect)
   └─ Suggested answers shown if incorrect
```

## Angular-Specific Features

### 1. Standalone Components

Modern Angular standalone components eliminate the need for NgModule:

```typescript
@Component({
  selector: 'app-dropdown',
  standalone: true,  // Standalone component
  imports: [CommonModule],  // Direct imports
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
```

**Benefits:**
- Simpler architecture
- Faster compilation
- Better tree-shaking
- No NgModule boilerplate

### 2. Modern Control Flow Syntax

Angular 17+ introduces new template syntax:

```html
<!-- Old syntax -->
<div *ngIf="isOpen">...</div>
<div *ngFor="let item of items">...</div>

<!-- New syntax -->
@if (isOpen) {
  <div>...</div>
}
@for (item of items; track item) {
  <div>...</div>
}
```

**Benefits:**
- Better performance
- Improved type checking
- More readable
- Built into the framework

### 3. Noop Zone for Performance

Instead of using Zone.js change detection, we use noop zone and manual change detection:

```typescript
const moduleRef = await platform.bootstrapModule(
    class { ngDoBootstrap() {} } as any,
    { ngZone: 'noop' }  // Disable automatic change detection
);

// Manually trigger change detection when needed
this.componentRef.changeDetectorRef.detectChanges();
```

**Benefits:**
- Better performance (no automatic change detection overhead)
- Full control over when updates occur
- Suitable for embedded components

### 4. Modern Component Creation API

Using Angular's latest component creation APIs:

```typescript
import { createComponent, ApplicationRef, EnvironmentInjector } from '@angular/core';

// Create component imperatively
this.componentRef = createComponent(TemplateRendererComponent, {
    environmentInjector: injector,
    hostElement: container
});

// Set inputs dynamically
this.componentRef.setInput('template', templateString);

// Access instance and subscribe to outputs
this.componentRef.instance.dropdownChange.subscribe(...);
```

### 5. Type Safety with TypeScript

Strong typing throughout the codebase:

```typescript
interface InitOptions {
  question: any;
  response: any;
  state: 'initial' | 'resume' | 'review';
  $el: HTMLElement;
  events: any;
}

interface ResponseValue {
  value: {
    [index: string]: string;
  };
}

// Type-safe component inputs
@Input() validationState: 'correct' | 'incorrect' | null = null;
```

## Styling Approach

### Component-Scoped Styles

Each component has its own SCSS file with `ViewEncapsulation.Emulated`:

```typescript
@Component({
  styleUrls: ['./dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated  // Default scoped styles
})
```

**Benefits:**
- Styles scoped to component
- No global CSS conflicts
- Maintainable and modular

### SCSS Structure

```scss
// _variables.scss
$prefix: lrn-custom-question;

// main.scss
@import "variables";

.lrn-custom-question {
    @import "question";
}

.question-rendering-container {
    padding-top: 50px;
}
```

### Component-Specific Styles

```scss
// dropdown.component.scss
.dropdown-container {
  display: inline-block;
  position: relative;

  &.dropdown-correct {
    .dropdown-trigger {
      border-color: #28a745;
      background-color: #d4edda;
    }
  }

  &.dropdown-incorrect {
    .dropdown-trigger {
      border-color: #dc3545;
      background-color: #f8d7da;
    }
  }
}

.dropdown-trigger {
  padding: 8px 32px 8px 12px;
  border: 2px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  position: relative;
  min-width: 80px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

### CSS Prefix Convention

All custom CSS uses the `lrn-custom-question` prefix to avoid conflicts:

```typescript
// constants.ts
export const PREFIX = 'lrn-custom-question';
```

## Build System

### Webpack Configuration

**Entry Points:**
```javascript
entry: {
    question: './src/question.ts',
    scorer: './src/scorer.ts'
}
```

**Output:**
```javascript
output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
}
```

**Loaders:**

1. **ts-loader** - Transpiles TypeScript
   ```javascript
   {
       test: /\.ts$/,
       use: 'ts-loader',
       exclude: /node_modules/
   }
   ```

2. **sass-loader + css-loader** - Processes SCSS
   ```javascript
   {
       test: /\.scss$/,
       use: [
           MiniCssExtractPlugin.loader,
           'css-loader',
           'sass-loader'
       ]
   }
   ```

**Plugins:**
- **MiniCssExtractPlugin** - Extracts CSS to separate file
- **CopyWebpackPlugin** - Copies authoring_custom_layout.html to dist/

### TypeScript Configuration

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "strict": true,
        "skipLibCheck": true
    }
}
```

### NPM Scripts

```json
{
    "dev": "webpack watch --mode development --devtool eval-source-map",
    "build": "webpack --mode production",
    "test": "jest",
    "test:watch": "jest --watch"
}
```

### Development Workflow

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   - Webpack watch mode with hot reload
   - Source maps enabled for debugging

2. **Make Changes:**
   - Edit Angular components in `src/app/components/`
   - Edit Question class in `src/app/question/index.ts`
   - Edit styles in component SCSS files

3. **Webpack Auto-Rebuilds:**
   - Compiles TypeScript to JavaScript
   - Bundles Angular components
   - Extracts CSS
   - Outputs to `dist/`

4. **Test in Browser:**
   - Navigate to your Learnosity test page
   - Learnosity loads question from dist/

## Testing

### Jest Configuration

```javascript
// jest.config.js
{
    preset: 'ts-jest',
    testEnvironment: 'jsdom',  // Simulates browser environment
    moduleDirectories: ['node_modules', 'src'],
    testMatch: ['**/*.spec.ts', '**/*.test.ts']
}
```

### Example Test

```typescript
// question/index.spec.ts
import Question from './index';

describe('Question', () => {
    let mockInit: any;
    let mockLrnUtils: any;

    beforeEach(() => {
        mockInit = {
            question: { custom_dropdown_template: 'Test {{dropdown}}' },
            response: null,
            state: 'initial',
            $el: { get: () => document.createElement('div') },
            events: { trigger: jest.fn(), on: jest.fn() }
        };
        mockLrnUtils = {};
    });

    it('should initialize correctly', () => {
        const question = new Question(mockInit, mockLrnUtils);
        expect(question).toBeDefined();
    });

    it('should create scorer', () => {
        const question = new Question(mockInit, mockLrnUtils);
        expect(question['scorer']).toBeDefined();
    });
});
```

## Learnosity Integration Points

### AMD Module Pattern

Both question.ts and scorer.ts use Learnosity's AMD pattern:

```typescript
declare const LearnosityAmd: any;

LearnosityAmd.define([], function () {
    return {
        Question  // or Scorer
    };
});
```

This allows Learnosity to dynamically load and instantiate the custom question.

### Question States

**initial** - First time rendering
```typescript
if (this.state === 'initial') {
    this.response = { value: {} };
}
```

**resume** - Restoring previously saved response
```typescript
if (this.state === 'resume') {
    this.response = this.question.response || { value: {} };
}
```

**review** - Read-only view after submission
```typescript
if (this.state === 'review') {
    this.isDisabled = true;
}
```

### Learnosity Events

**Triggering Events:**
```typescript
this.events.trigger('ready');        // Question fully loaded
this.events.trigger('changed', response);  // Response changed
```

**Listening to Events:**
```typescript
this.events.on('validate', () => {
    this.showValidationUI();
});

this.events.on('resetResponse', () => {
    this.resetResponse();
});
```

### Facade Methods (Public API)

These methods are exposed to Learnosity's Items API:

```typescript
registerPublicMethods(): void {
    this.facade = {
        disable: () => this.disable(),
        enable: () => this.enable(),
        resetResponse: () => this.resetResponse(),
        showValidationUI: () => this.showValidationUI(),
        resetValidationUI: () => this.resetValidationUI(),
        isValid: () => this.scorer.isValid()
    };
}
```

External code can call:
```javascript
itemsApp.question('question-id').disable();
itemsApp.question('question-id').resetResponse();
```

### Validation UI

Learnosity provides standard CSS classes for validation feedback:

```typescript
showValidationUI(): void {
    const isCorrect = this.scorer.isValid();
    const inputEl = this.el.querySelector(".lrn_response_input");

    if (isCorrect) {
        inputEl.classList.add("lrn_correct");
        inputEl.classList.remove("lrn_incorrect");
    } else {
        inputEl.classList.add("lrn_incorrect");
        inputEl.classList.remove("lrn_correct");
    }

    // Calculate individual dropdown validation states
    const validationStates: { [key: string]: 'correct' | 'incorrect' } = {};
    Object.entries(this.question.valid_response || {}).forEach(([index, validValue]) => {
        const actualValue = this.response.value[index];
        validationStates[index] = actualValue === validValue ? 'correct' : 'incorrect';
    });

    // Update component with validation states
    this.renderComponent({ validationStates });
}
```

## Key Takeaways

### Angular Pattern Summary

1. **Standalone Components** - Modern Angular architecture without NgModules
2. **Component Creation API** - Imperative component creation for embedding
3. **TypeScript Type Safety** - Strong typing throughout the codebase
4. **Manual Change Detection** - Noop zone with manual detectChanges() for performance
5. **Modern Template Syntax** - @if/@for control flow (Angular 17+)
6. **Component-Scoped Styles** - ViewEncapsulation for modular CSS
7. **Dependency Injection** - ElementRef, DomSanitizer, etc.

### Architecture Highlights

1. **Separation of Concerns**
   - Question class = Controller (TypeScript)
   - TemplateRendererComponent = View logic (Angular)
   - DropdownComponent = Reusable UI component (Angular)
   - Scorer = Validation logic (TypeScript)

2. **Template Token System**
   - Simple `{{dropdown}}` parsing
   - Flexible positioning in HTML
   - Index-based configuration mapping
   - Type-safe TemplatePart interface

3. **Learnosity Compatibility**
   - AMD module pattern
   - Event-driven architecture
   - Standard validation UI
   - Facade pattern for public API

4. **Modern Build Pipeline**
   - Webpack 5 for bundling
   - TypeScript 5.6 for type safety
   - SCSS for styling
   - Jest for testing

### Differences from React Version

| Aspect | React Version | Angular Version |
|--------|---------------|-----------------|
| **Framework** | React 19 | Angular 20 Standalone |
| **Language** | JavaScript (ES6+) | TypeScript |
| **Module System** | ES Modules | ES Modules + TypeScript |
| **Components** | Functional + Hooks | Class-based + Decorators |
| **State Management** | useState hook | Component properties |
| **Change Detection** | Automatic re-render | Manual detectChanges() |
| **Template Syntax** | JSX | HTML with directives |
| **Styling** | Inline styles | Component-scoped SCSS |
| **Build Tool** | Babel + Webpack | TypeScript + Webpack |
| **Type Safety** | Optional (PropTypes) | Built-in (TypeScript) |

### Best Practices Demonstrated

- Clean component composition
- Standalone component architecture
- Lifecycle hook usage (OnInit, OnChanges)
- Type-safe interfaces and decorators
- Input/Output event communication
- @HostListener for DOM events
- DomSanitizer for secure HTML rendering
- Manual change detection for performance
- Component-scoped styling
- Immutable state updates
- Modern template control flow

---

## Quick Reference

### File Locations

| Purpose | Path |
|---------|------|
| Main Question Logic | `src/app/question/index.ts` |
| Template Parser | `src/app/components/template-renderer/template-renderer.component.ts` |
| Dropdown UI | `src/app/components/dropdown/dropdown.component.ts` |
| Validation Logic | `src/app/scorer/index.ts` |
| Constants | `src/app/constants.ts` |
| Question Config | `question.json` |
| Editor Schema | `question_editor_init_options.json` |
| Authoring UI | `authoring_custom_layout.html` |
| Build Output | `dist/` |

### Command Reference

```bash
# Development with live reload
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Watch tests
npm run test:watch
```

### Component Hierarchy

```
Question (Vanilla TypeScript)
  └─ Angular Platform (noop zone)
      └─ TemplateRendererComponent (Standalone)
          ├─ DropdownComponent #1 (Standalone)
          ├─ DropdownComponent #2 (Standalone)
          └─ DropdownComponent #n (Standalone)
```

### Key Angular APIs Used

```typescript
// Component creation
import { createComponent, ApplicationRef, EnvironmentInjector } from '@angular/core';

// Platform bootstrap
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Component decorators
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

// Lifecycle hooks
import { OnInit, OnChanges, SimpleChanges } from '@angular/core';

// Common directives
import { CommonModule } from '@angular/common';

// Security
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
```