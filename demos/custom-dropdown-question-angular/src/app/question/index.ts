/**
 * Question Controller Class
 *
 * Main controller that bridges Learnosity's custom question framework with Angular components.
 * Manages the Angular component lifecycle, handles question states, and implements
 * Learnosity's public API.
 */

import { createComponent, ApplicationRef, ComponentRef, EnvironmentInjector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { TemplateRendererComponent } from '../components/template-renderer/template-renderer.component';
import Scorer from '../scorer/index';
import { PREFIX } from '../constants';
import '../../styles/main.scss';

interface LrnUtils {
  [key: string]: any;
}

interface InitOptions {
  question: any;
  response: any;
  state: 'initial' | 'resume' | 'review';
  $el: HTMLElement;
  events: any;
  [key: string]: any;
}

interface ResponseValue {
  value: {
    [index: string]: string;
  };
}

export default class Question {
  private question: any;
  private response: ResponseValue;
  private state: string;
  private el: HTMLElement;
  private events: any;
  private lrnUtils: LrnUtils;
  private facade: any;
  private scorer: Scorer;
  private componentRef: ComponentRef<TemplateRendererComponent> | null = null;
  private appRef: ApplicationRef | null = null;
  private isDisabled: boolean = false;

  constructor(init: InitOptions, lrnUtils: LrnUtils) {
    this.question = init.question;
    this.response = init.response || { value: {} };
    this.state = init.state || 'initial';
    this.el = init.$el.get(0);
    this.events = init.events;
    this.lrnUtils = lrnUtils;

    // Initialize scorer
    this.scorer = new Scorer(this.question, this.response.value);

    // Handle different question states
    if (this.state === 'initial') {
      this.response = { value: {} };
    } else if (this.state === 'resume') {
      this.response = this.question.response || { value: {} };
    } else if (this.state === 'review') {
      this.isDisabled = true;
    }

    // Render the question
    this.render().then(() => {
      this.registerPublicMethods();
      this.handleEvents();
      this.events.trigger('ready');
    });
  }

  /**
   * Render the question by creating DOM structure and bootstrapping Angular component
   */
  async render(): Promise<void> {
    // Create DOM structure
    this.el.innerHTML = `
      <div class="${PREFIX} lrn-response-validation-wrapper">
        <div class="lrn_response_input">
          <div class="question-rendering-container"></div>
        </div>
        <div class="${PREFIX}-checkAnswer-wrapper"></div>
        <div class="${PREFIX}-suggestedAnswers-wrapper"></div>
      </div>
    `;

    const container = this.el.querySelector('.question-rendering-container') as HTMLElement;

    if (!container) {
      throw new Error('Question rendering container not found');
    }

    // Bootstrap Angular component
    try {
      // Create a minimal platform for the component
      const platform = platformBrowserDynamic();
      const moduleRef = await platform.bootstrapModule(
        class {
          ngDoBootstrap() {}
        } as any,
        { ngZone: 'noop' } // Use noop zone for better performance
      );

      this.appRef = moduleRef.injector.get(ApplicationRef);
      const injector = moduleRef.injector.get(EnvironmentInjector);

      // Create the component
      this.componentRef = createComponent(TemplateRendererComponent, {
        environmentInjector: injector,
        hostElement: container
      });

      // Set component inputs
      this.componentRef.setInput('template', this.question.custom_dropdown_template);
      this.componentRef.setInput('question', this.question);
      this.componentRef.setInput('responseValue', this.response.value);
      this.componentRef.setInput('isDisabled', this.isDisabled);

      // Subscribe to component outputs
      this.componentRef.instance.dropdownChange.subscribe((responses: any) => {
        this.onValueChange(responses);
      });

      // Attach to application
      this.appRef.attachView(this.componentRef.hostView);
      this.componentRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error bootstrapping Angular component:', error);
      throw error;
    }
  }

  /**
   * Re-render the component with updated options
   */
  private renderComponent(options: {
    isDisabled?: boolean;
    validationStates?: { [key: string]: 'correct' | 'incorrect' | null };
  } = {}): void {
    if (!this.componentRef) {
      return;
    }

    const { isDisabled = false, validationStates = {} } = options;

    this.componentRef.setInput('responseValue', this.response.value);
    this.componentRef.setInput('isDisabled', isDisabled);
    this.componentRef.setInput('validationStates', validationStates);

    this.componentRef.changeDetectorRef.detectChanges();
  }

  /**
   * Handle dropdown value changes
   */
  private onValueChange(responses: { [key: string]: string }): void {
    this.response = { value: responses };

    // Update scorer with new response
    this.scorer = new Scorer(this.question, this.response.value);

    // Trigger Learnosity 'changed' event
    this.events.trigger('changed', this.response);
  }

  /**
   * Register public methods exposed to Learnosity API
   */
  private registerPublicMethods(): void {
    this.facade = {
      disable: () => this.disable(),
      enable: () => this.enable(),
      resetResponse: () => this.resetResponse(),
      showValidationUI: () => this.showValidationUI(),
      resetValidationUI: () => this.resetValidationUI(),
      isValid: () => this.scorer.isValid()
    };
  }

  /**
   * Get the public facade object
   */
  getFacade(): any {
    return this.facade;
  }

  /**
   * Handle Learnosity events
   */
  private handleEvents(): void {
    this.events.on('validate', (options: any) => {
      this.showValidationUI();
    });

    this.events.on('resetResponse', () => {
      this.resetResponse();
    });
  }

  /**
   * Disable all dropdowns
   */
  private disable(): void {
    this.isDisabled = true;
    this.renderComponent({ isDisabled: true });
  }

  /**
   * Enable all dropdowns
   */
  private enable(): void {
    this.isDisabled = false;
    this.renderComponent({ isDisabled: false });
  }

  /**
   * Reset all dropdown selections
   */
  private resetResponse(): void {
    this.response = { value: {} };
    this.renderComponent();
    this.resetValidationUI();
  }

  /**
   * Show validation UI with correct/incorrect feedback
   */
  private showValidationUI(): void {
    const isCorrect = this.scorer.isValid();
    const inputEl = this.el.querySelector('.lrn_response_input');

    if (!inputEl) {
      return;
    }

    // Add Learnosity validation classes
    if (isCorrect) {
      inputEl.classList.add('lrn_correct');
      inputEl.classList.remove('lrn_incorrect');
    } else {
      inputEl.classList.add('lrn_incorrect');
      inputEl.classList.remove('lrn_correct');
    }

    // Calculate validation states for each dropdown
    const validationStates: { [key: string]: 'correct' | 'incorrect' } = {};
    Object.entries(this.question.valid_response || {}).forEach(([index, validValue]) => {
      const actualValue = this.response.value[index];
      validationStates[index] = actualValue === validValue ? 'correct' : 'incorrect';
    });

    // Re-render with validation states
    this.renderComponent({ validationStates });

    // Show suggested answers if incorrect
    if (!isCorrect) {
      this.renderSuggestedAnswers();
    }
  }

  /**
   * Reset validation UI
   */
  private resetValidationUI(): void {
    const inputEl = this.el.querySelector('.lrn_response_input');

    if (inputEl) {
      inputEl.classList.remove('lrn_correct', 'lrn_incorrect');
    }

    // Clear suggested answers
    const suggestedAnswersEl = this.el.querySelector(`.${PREFIX}-suggestedAnswers-wrapper`);
    if (suggestedAnswersEl) {
      suggestedAnswersEl.innerHTML = '';
    }

    // Re-render without validation states
    this.renderComponent({ validationStates: {} });
  }

  /**
   * Render suggested correct answers
   */
  private renderSuggestedAnswers(): void {
    const suggestedAnswersEl = this.el.querySelector(`.${PREFIX}-suggestedAnswers-wrapper`);

    if (!suggestedAnswersEl) {
      return;
    }

    const validResponse = this.question.valid_response || {};
    const suggestedText = Object.values(validResponse).join(', ');

    suggestedAnswersEl.innerHTML = `
      <div class="lrn-suggested-answers">
        <strong>Suggested answer:</strong> ${suggestedText}
      </div>
    `;
  }

  /**
   * Cleanup when question is destroyed
   */
  destroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    if (this.appRef) {
      this.appRef.detachView(this.componentRef!.hostView);
    }
  }
}
