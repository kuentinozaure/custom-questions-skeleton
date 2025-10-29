# Custom Dropdown Question - How It Works

## Overview

The custom-dropdown-question is a Learnosity custom question type that lets authors create fill-in-the-blank style questions with dropdown selections embedded in custom HTML templates. It's built with **React 19** and integrates seamlessly with the Learnosity assessment platform.

## Technology Stack

- **React 19.2.0** - Modern functional components with hooks
- **ReactDOM 19.2.0** - DOM rendering
- **Webpack** - Module bundling and build system
- **Babel** - JSX and ES6+ transpilation
- **SCSS** - Styling with Sass preprocessor
- **Jest** - Unit testing framework

## Project Structure

```
custom-dropdown-question/
├── src/
│   ├── question/
│   │   ├── components/
│   │   │   ├── Dropdown.js          # Custom dropdown UI component
│   │   │   └── QuestionTemplate.js   # Template parser and renderer
│   │   ├── constants.js              # CSS prefix constant
│   │   └── index.js                  # Main Question controller class
│   ├── scorer/
│   │   └── index.js                  # Server-side validation logic
│   ├── question.js                   # Question entry point (Learnosity AMD)
│   └── scorer.js                     # Scorer entry point (Learnosity AMD)
├── scss/
│   ├── _variables.scss               # SCSS variables
│   ├── _question.scss                # Question-specific styles
│   └── main.scss                     # Main stylesheet
├── tests/
│   └── units/                        # Jest unit tests
├── dist/                             # Build output directory
├── authoring_custom_layout.html      # Question editor UI layout
├── question.json                     # Question type definition
├── question_editor_init_options.json # Editor configuration schema
├── webpack.config.js                 # Build configuration
└── babel.config.js                   # Babel configuration
```

## How React is Integrated

### The Integration Pattern

Unlike typical React apps that control the entire page, this implementation **embeds React within Learnosity's custom question framework**. The Question class (vanilla JavaScript) manages the React lifecycle:

```javascript
// src/question/index.js
class Question {
    constructor(init, lrnUtils) {
        // Initialize question
        this.render().then(() => {
            this.registerPublicMethods();
            this.handleEvents();
            init.events.trigger('ready');
        });
    }

    render() {
        // Create DOM structure
        el.innerHTML = `
            <div class="${PREFIX} lrn-response-validation-wrapper">
                <div class="lrn_response_input">
                    <div class="question-rendering-container"></div>
                </div>
                <!-- validation containers -->
            </div>
        `;

        // Create React root and render components
        const reactDomContainer = el.querySelector('.question-rendering-container');
        this.reactRoot = ReactDOM.createRoot(reactDomContainer);
        this.renderComponent();
    }

    renderComponent(options = {}) {
        const { isDisabled = false, validationStates = {} } = options;

        this.reactRoot.render(
            React.createElement(TemplateRenderer, {
                template: this.question.custom_dropdown_template,
                dropdownConfigs: this.question.dropdown_configs,
                responseValue: this.response.value,
                isDisabled,
                validationStates,
                onDropdownChange: this.onValueChange.bind(this)
            })
        );
    }
}
```

### Why This Approach?

1. **Learnosity Compatibility** - Works within Learnosity's AMD module system
2. **Lifecycle Control** - Question class manages when React mounts/unmounts
3. **State Management** - Question class bridges between Learnosity API and React
4. **Event Integration** - Seamlessly triggers Learnosity events from React components

## Core Components

### 1. Question Class (`src/question/index.js`)

**Role:** Main controller that bridges Learnosity and React

**Key Responsibilities:**
- Creates and manages React root
- Handles question initialization (initial, resume, review states)
- Registers public methods for Learnosity API
- Manages validation events and UI
- Bridges data between Learnosity and React components

**Public API Methods:**
```javascript
disable()           // Disable all dropdowns
enable()            // Enable all dropdowns
resetResponse()     // Clear all selections
showValidationUI()  // Display correct/incorrect feedback
resetValidationUI() // Clear validation feedback
isValid()           // Check if response is correct
```

**Event Flow:**
```javascript
onValueChange(responses) {
    // Update internal response object
    this.response = { value: responses };

    // Trigger Learnosity 'changed' event
    this.events.trigger('changed', this.response);
}
```

### 2. TemplateRenderer Component (`src/question/components/QuestionTemplate.js`)

**Role:** Parses template and embeds dropdown components

**How It Works:**

1. **Template Parsing** - Splits template string by `{{dropdown}}` tokens
2. **Component Embedding** - Inserts Dropdown components at each token position
3. **State Management** - Tracks current response using useState hook
4. **Change Handling** - Propagates dropdown changes to parent

```javascript
const TemplateRenderer = ({
    template,
    dropdownConfigs,
    responseValue,
    isDisabled,
    validationStates,
    onDropdownChange
}) => {
    const [currentResponse, setCurrentResponse] = useState(responseValue || {});

    const handleChange = (value, index) => {
        const updatedResponse = { ...currentResponse, [index]: value };
        setCurrentResponse(updatedResponse);
        onDropdownChange(updatedResponse);
    };

    // Split template by {{dropdown}} tokens
    const parts = template.split('{{dropdown}}');

    return (
        <div>
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {/* Render HTML part */}
                    <span dangerouslySetInnerHTML={{ __html: part }} />

                    {/* Render Dropdown if not last part */}
                    {index < parts.length - 1 && (
                        <Dropdown
                            config={dropdownConfigs[index]}
                            value={currentResponse[index]}
                            onChange={(value) => handleChange(value, index)}
                            isDisabled={isDisabled}
                            validationState={validationStates[index]}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
```

**React Patterns Used:**
- **useState Hook** - Managing response state
- **Controlled Components** - Dropdowns fully controlled by React
- **Fragment Pattern** - Clean rendering without extra DOM nodes
- **Callback Props** - Upward data flow to parent component

### 3. Dropdown Component (`src/question/components/Dropdown.js`)

**Role:** Custom dropdown UI with inline styles

**Features:**
- Fully controlled component (value managed by parent)
- Click-outside detection to close dropdown
- Keyboard-friendly design
- Custom styling without external UI library
- Visual feedback for selected state

```javascript
const Dropdown = ({ config, value, onChange, isDisabled, validationState }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click-outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={containerStyle}>
            {/* Trigger button */}
            <button
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                disabled={isDisabled}
            >
                {value || config.placeholder || '?'}
            </button>

            {/* Dropdown options */}
            {isOpen && (
                <div style={dropdownOptionsStyle}>
                    {config.options.map((option, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(option)}
                            style={{
                                ...optionStyle,
                                ...(value === option ? selectedOptionStyle : {})
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

**React Patterns Used:**
- **useState Hook** - Managing open/close state
- **useEffect Hook** - Side effects and cleanup
- **useRef Hook** - DOM reference for click detection
- **Inline Styles** - Component encapsulation

### 4. Scorer Class (`src/scorer/index.js`)

**Role:** Server-side validation logic

**Responsibilities:**
- Validates student responses against correct answers
- Provides scoring metrics
- Returns validation state

```javascript
class Scorer {
    constructor(question, response) {
        this.question = question;
        this.response = response || {};
    }

    isValid() {
        // Check if all dropdown responses match valid_response
        return Object.entries(this.question.valid_response).every(([index, value]) => {
            return this.response[index] === value;
        });
    }

    canValidateResponse() {
        return true; // Question is scorable
    }

    // TODO: Implement these methods
    validateIndividualResponses() {}
    score() {}
    maxScore() {}
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
- Response object uses numeric keys matching dropdown positions
- `valid_response` defines correct answer for each dropdown

## How Template Parsing Works

### Step-by-Step Process

**1. Template String:**
```
"The capital of France is {{dropdown}}. It has a population of {{dropdown}} million."
```

**2. Split by Token:**
```javascript
const parts = template.split('{{dropdown}}');
// Result: ["The capital of France is ", ". It has a population of ", " million."]
```

**3. Render with Dropdowns:**
```jsx
<div>
    <span>The capital of France is </span>
    <Dropdown config={dropdownConfigs[0]} ... />
    <span>. It has a population of </span>
    <Dropdown config={dropdownConfigs[1]} ... />
    <span> million.</span>
</div>
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
   ├─ Learnosity loads question.js via AMD
   ├─ Question class constructor called with init data
   ├─ Question.render() creates DOM structure
   ├─ ReactDOM.createRoot() creates React root
   └─ renderComponent() renders TemplateRenderer

3. RENDERING
   ├─ TemplateRenderer receives template and configs
   ├─ Template parsed by splitting on {{dropdown}}
   ├─ Dropdown components created for each token
   └─ Initial response values populated

4. INTERACTION
   ├─ Student clicks dropdown
   ├─ Dropdown opens with options
   ├─ Student selects option
   ├─ Dropdown.onChange(value) called
   ├─ TemplateRenderer.handleChange() updates state
   ├─ TemplateRenderer.onDropdownChange() calls parent
   ├─ Question.onValueChange() updates response
   └─ Learnosity 'changed' event triggered

5. VALIDATION
   ├─ Student clicks "Check Answer"
   ├─ Learnosity triggers 'validate' event
   ├─ Scorer.isValid() checks response vs valid_response
   ├─ Question.showValidationUI() displays feedback
   └─ CSS classes added (lrn_correct / lrn_incorrect)
```

## Configuration Files

### question.json

Defines the custom question type for Learnosity:

```json
{
    "custom_type": "custom_dropdown",
    "type": "custom",
    "name": "Custom Dropdown",
    "description": "A custom question type with dropdown selections",
    "question_type_templates": {
        "path": "/dist/question.js"
    },
    "scoring_type_templates": {
        "path": "/dist/scorer.js"
    },
    "css_path": "/dist/question.css",
    "instant_feedback": true
}
```

### question_editor_init_options.json

Comprehensive configuration defining the authoring experience:

**Key Sections:**

1. **Question Type Groups** - Categorizes question in editor
2. **Question Templates** - Default values for new questions
3. **Editor Layout** - Path to custom authoring HTML
4. **Editor Schema** - Defines all editable attributes

**Editor Schema Example:**

```json
{
    "editor_schema": {
        "attributes": {
            "custom_dropdown_template": {
                "type": "string",
                "name": "Question Template",
                "description": "HTML template with {{dropdown}} tokens",
                "required": true,
                "ui_style": {
                    "type": "ckeditor"
                }
            },
            "dropdown_configs": {
                "type": "array",
                "name": "Dropdown Configurations",
                "items": {
                    "type": "object",
                    "properties": {
                        "placeholder": { "type": "string" },
                        "options": {
                            "type": "array",
                            "items": { "type": "string" }
                        }
                    }
                }
            },
            "valid_response": {
                "type": "object",
                "name": "Correct Response"
            }
        }
    }
}
```

### authoring_custom_layout.html

Custom authoring UI using Learnosity directives:

```html
<div class="lrn-qe-row-flex">
    <div class="lrn-qe-col-sm-12">
        <span data-lrn-qe-label="stimulus"></span>
        <div data-lrn-qe-input="stimulus"></div>
    </div>
</div>

<div class="lrn-qe-row-flex">
    <div class="lrn-qe-col-sm-12">
        <span data-lrn-qe-label="custom_dropdown_template"></span>
        <div data-lrn-qe-input="custom_dropdown_template"></div>
    </div>
</div>

<!-- Dropdown configurations with loop -->
<div data-lrn-qe-loop="dropdown_configs">
    <div class="lrn-qe-row-flex">
        <div class="lrn-qe-col-sm-6">
            <span>Dropdown <span data-lrn-element-index></span></span>
        </div>
    </div>
    <!-- placeholder and options inputs -->
</div>
```

**Learnosity Directives:**
- `data-lrn-qe-label` - Field label
- `data-lrn-qe-input` - Input field
- `data-lrn-qe-loop` - Array iteration
- `data-lrn-qe-action-add/remove` - Array manipulation
- `data-lrn-element-index` - Current index in loop

## Styling Approach

### No External UI Framework

The implementation uses **custom inline styles** and **SCSS** instead of a UI framework like Material-UI or Bootstrap.

**Why?**
- Full control over appearance
- No dependency conflicts
- Consistent with Learnosity's styling
- Smaller bundle size

### SCSS Structure

```scss
// _variables.scss
$prefix: lrn-custom-question-;

// main.scss
@import "variables";

.lrn-custom-question {
    @import "question";
}

.question-rendering-container {
    padding-top: 50px;
}
```

### Inline Styles in Dropdown Component

```javascript
const dropdownOptionsStyle = {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',  // Position above trigger
    left: '50%',
    transform: 'translate(-50%)',
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '220px',
    padding: '8px'
};
```

### CSS Prefix Convention

All custom CSS uses the `lrn-custom-question` prefix to avoid conflicts:

```javascript
// constants.js
export const PREFIX = 'lrn-custom-question';
```

## Build System

### Webpack Configuration

**Entry Points:**
```javascript
entry: {
    question: './src/question.js',
    scorer: './src/scorer.js'
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

1. **babel-loader** - Transpiles JSX and ES6+
   ```javascript
   {
       test: /\.js$/,
       exclude: /node_modules/,
       use: {
           loader: 'babel-loader',
           options: {
               presets: [
                   '@babel/preset-env',
                   '@babel/preset-react'
               ]
           }
       }
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

### NPM Scripts

```json
{
    "dev": "yarn install && php -S localhost:1234 & webpack watch --mode development",
    "prod": "yarn install && webpack --mode production",
    "unit-tests": "jest",
    "unit-tests-watch": "jest --watch"
}
```

### Development Workflow

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   - Starts PHP server on localhost:1234
   - Webpack watch mode with hot reload
   - Source maps enabled

2. **Make Changes:**
   - Edit React components in `src/question/components/`
   - Edit Question class in `src/question/index.js`
   - Edit styles in `scss/`

3. **Webpack Auto-Rebuilds:**
   - Transpiles JSX to JavaScript
   - Bundles modules
   - Extracts CSS
   - Outputs to `dist/`

4. **Test in Browser:**
   - Navigate to localhost:1234
   - Learnosity loads question from dist/

## Testing

### Jest Configuration

```javascript
// jest.config.js
{
    testEnvironment: 'jsdom',  // Simulates browser environment
    moduleDirectories: ['node_modules', 'src'],
    testMatch: ['**/*.spec.js', '**/*.test.js']
}
```

### Example Test

```javascript
// tests/units/question/index.spec.js
describe('Question', () => {
    it('should initialize correctly', () => {
        const question = new Question(mockInit, mockLrnUtils);
        expect(question).toBeDefined();
    });

    it('should render component', () => {
        const question = new Question(mockInit, mockLrnUtils);
        return question.render().then(() => {
            expect(question.reactRoot).toBeDefined();
        });
    });
});
```

### Server-Side Scorer Debugging

```javascript
// debugServerScorer.js
const scorerModule = require('./dist/scorer.js');
const Scorer = scorerModule.Scorer;

const question = {
    valid_response: { "0": "Paris", "1": "2" }
};

const response = { "0": "Paris", "1": "2" };

const scorer = new Scorer(question, response);
console.log('Is valid?', scorer.isValid());  // true
```

## Learnosity Integration Points

### AMD Module Pattern

Both question.js and scorer.js use Learnosity's AMD pattern:

```javascript
LearnosityAmd.define([], function () {
    return {
        Question  // or Scorer
    };
});
```

This allows Learnosity to dynamically load and instantiate the custom question.

### Question States

**initial** - First time rendering
```javascript
if (this.state === 'initial') {
    this.response = { value: {} };
}
```

**resume** - Restoring previously saved response
```javascript
if (this.state === 'resume') {
    this.response = this.question.response || { value: {} };
}
```

**review** - Read-only view after submission
```javascript
if (this.state === 'review') {
    this.isDisabled = true;
}
```

### Learnosity Events

**Triggering Events:**
```javascript
this.events.trigger('ready');        // Question fully loaded
this.events.trigger('changed', response);  // Response changed
```

**Listening to Events:**
```javascript
this.events.on('validate', () => {
    this.showValidationUI();
});

this.events.on('resetResponse', () => {
    this.resetResponse();
});
```

### Facade Methods (Public API)

These methods are exposed to Learnosity's Items API:

```javascript
registerPublicMethods() {
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

```javascript
showValidationUI() {
    const isCorrect = this.scorer.isValid();
    const inputEl = el.querySelector(".lrn_response_input");

    if (isCorrect) {
        inputEl.classList.add("lrn_correct");
        inputEl.classList.remove("lrn_incorrect");
    } else {
        inputEl.classList.add("lrn_incorrect");
        inputEl.classList.remove("lrn_correct");
    }

    // Show suggested answers if incorrect
    if (!isCorrect) {
        this.renderSuggestedAnswers();
    }
}
```

## Key Takeaways

### React Pattern Summary

1. **React is embedded, not the app** - Vanilla JS controls React lifecycle
2. **Functional components with hooks** - Modern React 19 patterns
3. **Controlled components** - Parent manages state via props
4. **No Redux/Context** - Simple prop drilling is sufficient
5. **Inline styles** - Component encapsulation without CSS conflicts

### Architecture Highlights

1. **Separation of Concerns**
   - Question class = Controller
   - TemplateRenderer = View logic
   - Dropdown = Reusable UI component
   - Scorer = Validation logic

2. **Template Token System**
   - Simple `{{dropdown}}` parsing
   - Flexible positioning in HTML
   - Index-based configuration mapping

3. **Learnosity Compatibility**
   - AMD module pattern
   - Event-driven architecture
   - Standard validation UI
   - Facade pattern for public API

4. **Modern Build Pipeline**
   - Webpack for bundling
   - Babel for transpilation
   - SCSS for styling
   - Jest for testing

### Best Practices Demonstrated

- Clean component composition
- Proper React hooks usage
- Event listener cleanup in useEffect
- Controlled vs uncontrolled components
- Inline styles for encapsulation
- Click-outside pattern with useRef
- State lifting and callback props
- Immutable state updates

---

## Quick Reference

### File Locations

| Purpose | Path |
|---------|------|
| Main Question Logic | `src/question/index.js` |
| Template Parser | `src/question/components/QuestionTemplate.js` |
| Dropdown UI | `src/question/components/Dropdown.js` |
| Validation Logic | `src/scorer/index.js` |
| Question Config | `question.json` |
| Editor Schema | `question_editor_init_options.json` |
| Authoring UI | `authoring_custom_layout.html` |
| Build Output | `dist/` |

### Command Reference

```bash
# Development with live reload
npm run dev

# Production build
npm run prod

# Run tests
npm run unit-tests

# Watch tests
npm run unit-tests-watch

# Debug scorer
npm run debug-server-scorer
```

### React Component Hierarchy

```
Question (Vanilla JS)
  └─ React Root
      └─ TemplateRenderer
          ├─ Dropdown #1
          ├─ Dropdown #2
          └─ Dropdown #n
```
