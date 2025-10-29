# Custom Dropdown Question Angular - How It Works

## Overview

The custom-dropdown-question-angular is a Learnosity custom question type that lets authors create fill-in-the-blank style questions with dropdown selections embedded in custom HTML templates. It's built with **Angular 20** using the latest **signals-based architecture** and modern Angular patterns, integrating seamlessly with the Learnosity assessment platform.

## Technology Stack

- **Angular 20.0.0** - Modern standalone components with signals
- **Angular Signals** - Reactive state management (input(), output(), signal(), computed(), effect())
- **TypeScript 5.6.0** - Type-safe development
- **Zone.js 0.15.0** - Change detection (using noop zone for performance)
- **Webpack 5** - Module bundling and build system
- **SCSS** - Component-scoped styling
- **Jest** - Unit testing framework

## Project Structure

```
custom-dropdown-question-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dropdown/
│   │   │   │   ├── dropdown.component.ts        # Dropdown with inline template
│   │   │   │   └── dropdown.component.scss      # Dropdown styles
│   │   │   └── template-renderer/
│   │   │       ├── template-renderer.component.ts   # Renderer with inline template
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

## Modern Angular Patterns Used

This implementation uses the **latest Angular features** (Angular 17+):

### 1. **Signal-Based Inputs and Outputs**
```typescript
// Instead of @Input() and @Output()
value = input<string | undefined>(undefined);
options = input<string[]>([]);
valueChange = output<string>();
```

### 2. **Signals for State Management**
```typescript
// Reactive state using signals
isOpen = signal(false);
currentResponse = signal<ResponseValue>({});
```

### 3. **Computed Values**
```typescript
// Derived values that automatically update
displayValue = computed(() => {
    const val = this.value();
    return val !== undefined ? val : this.placeholder();
});
```

### 4. **Effects for Side Effects**
```typescript
// React to signal changes
effect(() => {
    const templateValue = this.template();
    this.parseTemplate(templateValue);
});
```

### 5. **Modern Template Syntax**
```typescript
// @if and @for instead of *ngIf and *ngFor
@if (isOpen()) {
    <ul>
        @for (option of options(); track option) {
            <li>{{ option }}</li>
        }
    </ul>
}
```

### 6. **Inline Templates with Separate Styles**
```typescript
@Component({
  template: `<div>...</div>`,          // Inline HTML
  styleUrl: './component.scss'         // Separate SCSS file
})
```

## Component Architecture

### DropdownComponent Example

```typescript
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
      >
        {{ displayValue() }}
      </button>

      @if (isOpen()) {
        <ul class="dropdown-options">
          @for (option of options(); track option) {
            <li [class.selected]="isSelected(option)" (click)="selectOption(option)">
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
  // Signal-based inputs
  value = input<string | undefined>(undefined);
  options = input<string[]>([]);
  isDisabled = input<boolean>(false);
  
  // Signal-based output
  valueChange = output<string>();
  
  // Internal state
  isOpen = signal(false);
  
  // Computed values
  displayValue = computed(() => 
    this.value() ?? this.placeholder()
  );
  
  toggleDropdown() {
    if (!this.isDisabled()) {
      this.isOpen.set(!this.isOpen());
    }
  }
  
  selectOption(option: string) {
    this.valueChange.emit(option);
    this.isOpen.set(false);
  }
}
```

**Benefits of This Approach:**
- **Inline Template**: Easy to see component structure at a glance
- **Separate Styles**: Better organization for complex styling, SCSS features, and reusability
- **Signals**: Fine-grained reactivity and automatic dependency tracking
- **Modern Syntax**: @if/@for for better performance and type checking

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

### 2. TemplateRendererComponent

**Role:** Parses template and embeds dropdown components using modern Angular signals

```typescript
@Component({
  selector: 'app-template-renderer',
  standalone: true,
  imports: [DropdownComponent],
  template: `
    <div class="template-renderer">
      @for (part of templateParts(); track $index) {
        <span [innerHTML]="part.htmlContent"></span>

        @if (!part.isLastPart && part.dropdownConfig) {
          <app-dropdown
            [value]="getDropdownValue(part.dropdownIndex!)"
            [options]="part.dropdownConfig.options"
            [placeholder]="part.dropdownConfig.placeholder || '?'"
            [isDisabled]="isDisabled()"
            [validationState]="getValidationState(part.dropdownIndex!)"
            (valueChange)="onDropdownChange($event, part.dropdownIndex!)"
          />
        }
      }
    </div>
  `,
  styleUrl: './template-renderer.component.scss'
})
export class TemplateRendererComponent {
  // Signal-based inputs
  template = input<string>('');
  question = input.required<QuestionData>();
  responseValue = input<ResponseValue>({});
  isDisabled = input<boolean>(false);
  validationStates = input<ValidationStates>({});

  // Output
  dropdownChange = output<ResponseValue>();

  // Internal state using signals
  currentResponse = signal<ResponseValue>({});
  templateParts = signal<TemplatePart[]>([]);

  constructor(private sanitizer: DomSanitizer) {
    // Effect to parse template when it changes
    effect(() => {
      const templateValue = this.template();
      const questionValue = this.question();
      this.parseTemplate(templateValue, questionValue);
    });

    // Effect to update current response when responseValue changes
    effect(() => {
      const response = this.responseValue();
      this.currentResponse.set({ ...response });
    });
  }

  onDropdownChange(value: string, index: number): void {
    const updatedResponse = {
      ...this.currentResponse(),
      [index]: value
    };
    this.currentResponse.set(updatedResponse);
    this.dropdownChange.emit(updatedResponse);
  }
}
```

**Key Features:**
- **Effects** automatically re-parse template when inputs change
- **Signals** provide reactive state management
- **Inline template** with @for/@if modern syntax
- **Separate SCSS** for component styling

### 3. DropdownComponent

**Role:** Modern dropdown UI using Angular signals

```typescript
export class DropdownComponent {
  // Signal-based inputs
  value = input<string | undefined>(undefined);
  options = input<string[]>([]);
  placeholder = input<string>('?');
  isDisabled = input<boolean>(false);
  validationState = input<'correct' | 'incorrect' | null>(null);

  // Signal-based output
  valueChange = output<string>();

  // Internal state
  isOpen = signal(false);

  // Computed values
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
}
```

**Angular Patterns Used:**
- **input()** - Signal-based component inputs
- **output()** - Modern event emitters
- **signal()** - Reactive state management
- **computed()** - Derived reactive values
- **@HostListener** - DOM event listening
- **@if/@for** - Modern control flow syntax

## Data Flow with Signals

```
1. INITIALIZATION
   ├─ Angular component created with createComponent()
   ├─ Inputs set via componentRef.setInput()
   ├─ Input signals receive values
   └─ Effects trigger automatically

2. TEMPLATE PARSING (Reactive)
   ├─ effect() runs when template() or question() signal changes
   ├─ parseTemplate() processes the template string
   ├─ templateParts signal updated
   └─ Template automatically re-renders

3. USER INTERACTION
   ├─ Student clicks dropdown
   ├─ isOpen signal updated: isOpen.set(true)
   ├─ Template reactively shows options (@if)
   ├─ Student selects option
   ├─ valueChange output emits
   ├─ Parent updates currentResponse signal
   └─ Reactivity propagates through signal graph

4. VALIDATION
   ├─ validationStates input signal updated
   ├─ computed() validationClass updates automatically
   ├─ Template applies new classes
   └─ Visual feedback shown instantly
```

## Angular Signals Deep Dive

### Signal Types Used

1. **input()** - Component inputs as signals
```typescript
value = input<string>('default');           // Optional with default
question = input.required<QuestionData>();   // Required input
```

2. **output()** - Component outputs
```typescript
valueChange = output<string>();
// Usage: this.valueChange.emit(value);
```

3. **signal()** - Writable signals
```typescript
isOpen = signal(false);
// Read: this.isOpen()
// Write: this.isOpen.set(true)
// Update: this.isOpen.update(val => !val)
```

4. **computed()** - Derived signals
```typescript
displayValue = computed(() => {
    return this.value() || this.placeholder();
});
```

5. **effect()** - Side effects
```typescript
effect(() => {
    const template = this.template();
    this.parseTemplate(template);
});
```

### Why Signals?

- **Fine-grained reactivity** - Only affected parts re-render
- **Better performance** - No Zone.js overhead
- **Simpler mental model** - Clear data dependencies
- **Automatic tracking** - Effects track dependencies automatically

## Modern Control Flow Syntax

Angular 17+ introduces built-in control flow:

### @if / @else
```html
@if (isOpen()) {
  <div>Open</div>
} @else {
  <div>Closed</div>
}
```

### @for
```html
@for (item of items(); track item) {
  <li>{{ item }}</li>
}
```

**Benefits:**
- Better performance
- Better type checking
- Cleaner syntax
- Track required (forces you to think about performance)

## Styling Approach

### Inline Templates + Separate SCSS Files

```typescript
@Component({
  selector: 'app-dropdown',
  standalone: true,
  template: `
    <div class="dropdown-container">
      <!-- Inline HTML for easy reference -->
    </div>
  `,
  styleUrl: './dropdown.component.scss'  // Separate SCSS for organization
})
```

**Benefits:**
- **Inline Template**: See component structure immediately
- **Separate Styles**: 
  - Better organization for complex styling
  - Full SCSS features (nesting, variables, mixins)
  - Easier to maintain large stylesheets
  - Component-scoped by default (no conflicts)

### Example SCSS (dropdown.component.scss)

```scss
.dropdown-container {
  display: inline-block;
  position: relative;
}

.dropdown-trigger {
  padding: 6px 12px;
  border: 1px solid #ccc;

  &:hover:not(:disabled) {
    border-color: #999;
  }

  &.has-value {
    font-weight: 500;
  }
}

.dropdown-correct {
  .dropdown-trigger {
    border-color: #4caf50;
    background-color: #e8f5e9;
  }
}
```

## Key Takeaways

### Modern Angular Pattern Summary

1. **Signals Everywhere** - input(), output(), signal(), computed(), effect()
2. **No Decorators for I/O** - input()/output() instead of @Input()/@Output()
3. **Reactive by Default** - Signals provide automatic reactivity
4. **Modern Control Flow** - @if/@for instead of *ngIf/*ngFor
5. **Hybrid Approach** - Inline templates + separate SCSS files
6. **No NgModules** - Standalone components only
7. **Type Safety** - Full TypeScript throughout

### Architecture Highlights

1. **Separation of Concerns**
   - Question class = Controller (TypeScript)
   - TemplateRendererComponent = View logic (Angular + Signals)
   - DropdownComponent = Reusable UI (Angular + Signals)
   - Scorer = Validation logic (TypeScript)

2. **Reactive Template System**
   - Signals for reactive updates
   - Effects for side effects
   - Computed for derived values
   - Automatic dependency tracking

### Differences from Traditional Angular

| Aspect | Old Angular | Modern Angular (This Project) |
|--------|-------------|-------------------------------|
| **Inputs** | @Input() decorator | input() signal |
| **Outputs** | @Output() EventEmitter | output() |
| **State** | Class properties | signal() |
| **Derived** | Getters/methods | computed() |
| **Side Effects** | ngOnInit/ngOnChanges | effect() |
| **Templates** | *ngIf/*ngFor | @if/@for |
| **Template Location** | Separate .html | Inline in .ts |
| **Styles Location** | Separate .scss | Separate .scss (styleUrl) |
| **Modules** | NgModule | Standalone |
| **Change Detection** | Zone.js | Noop zone + manual |

## Quick Reference

### Command Reference

```bash
# Development with live reload
npm run dev

# Production build
npm run build

# Run tests
npm run test
```

### Signal Cheat Sheet

```typescript
// Input signals (replaces @Input)
value = input<string>('default');           // optional with default
required = input.required<string>();        // required

// Output (replaces @Output)
change = output<string>();                  // emit with: this.change.emit(value)

// Writable signals
count = signal(0);                          // create
count()                                     // read
count.set(5)                                // write
count.update(n => n + 1)                    // update

// Computed signals
doubled = computed(() => this.count() * 2); // auto-updates

// Effects
effect(() => {
    console.log(this.count());              // runs when count changes
});
```

### Component Template Pattern

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  template: `
    <div class="container">
      @if (show()) {
        <p>{{ message() }}</p>
      }
      
      @for (item of items(); track item.id) {
        <div>{{ item.name }}</div>
      }
    </div>
  `,
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  show = input(true);
  message = input.required<string>();
  items = signal<Item[]>([]);
  
  computed = computed(() => this.items().length);
  
  constructor() {
    effect(() => {
      console.log('Items changed:', this.items());
    });
  }
}
```
