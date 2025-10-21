import { PREFIX, CLASS_NAMES } from './constants';

export default class Question {
    constructor(init, lrnUtils) {
        this.init = init;
        this.events = init.events;
        this.lrnUtils = lrnUtils;
        this.el = init.$el.get(0);

        this.render().then(() => {
            this.registerPublicMethods();
            this.handleEvents();

            const { state, response } = init
            const { el } = this

            if ((state === 'resume' || state === 'review') && response) {

                Array.from(el.querySelectorAll('.response-input')).forEach((input, index) => {
                    input.value = init.response[index]
                })
            }
            if (state === 'review') init.getFacade().disable();


            init.events.trigger('ready');
        });
    }

    render() {
        const { el, init, lrnUtils } = this;
        const { question, response } = init;

        // TODO: Requires implementation
        el.innerHTML = `
            <div class="${PREFIX} lrn-response-validation-wrapper">
                <div class="lrn_response_input">
                    
                </div>      
                <div class="${PREFIX}-checkAnswer-wrapper"></div>
                <div class="${PREFIX}-suggestedAnswers-wrapper"></div>
            </div>
        `;

        // Optional - Render optional Learnosity components like Check Answer Button, Suggested Answers List
        // first before rendering your question's components
        return Promise.all([
            lrnUtils.renderComponent('SuggestedAnswersList', el.querySelector(`.${PREFIX}-suggestedAnswers-wrapper`)),
            lrnUtils.renderComponent('CheckAnswerButton', el.querySelector(`.${PREFIX}-checkAnswer-wrapper`))
        ]).then(([suggestedAnswersList]) => {
            this.suggestedAnswersList = suggestedAnswersList;

            // select the response area for your custom question
            const responseArea = el.querySelector('.lrn_response_input');

            // create a div
            const studentQuestion = document.createElement('div');
            studentQuestion.classList.add("student-question");
            // set it's innerHTML to the questions template as read from quesiton.json (your custom quesition's JSON source)
            studentQuestion.innerHTML = question.template;

            // replace all of the "RESPONSE" placeholder spans with an input element instead
            const placeholders = studentQuestion.querySelectorAll('span.custom-response-placeholder');
            placeholders.forEach((placeholder, index) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.classList.add('response-input');
                placeholder.replaceWith(input)
            })

            // append the question template with the inputs which have replaced the placeholders
            // into the question response area for the learner to answer each input
            responseArea.appendChild(studentQuestion)

            // prevent a new blank input that appears after pressing the custom "insert response"
            // button from showing "undefined"
            // This is done with CSS by making it's color white adding a class called "blank"
            // and then as soon as it is focused, set it's value to "" and remove the styles
            el.querySelectorAll('.response-input').forEach((input, index) => {
                if (!question.validation.valid_response.value[index]) {
                    input.classList.add('blank')
                }
                input.addEventListener('focus', () => {
                    if (input.classList.contains('blank')) {
                        input.classList.remove('blank')
                        input.value = "";
                    }
                })
            })
        });
    }

    /**
     * Add public methods to the created question instance that is accessible during runtime
     *
     * Example: questionsApp.question('my-custom-question-response-id').myNewMethod();
     * 
     */
    registerPublicMethods() {
        const { init, el } = this;
        // Attach the methods you want on this object
        const facade = init.getFacade();
        const responseArea = el.querySelector('.lrn_response_input');
        const responseInputs = Array.from(el.querySelectorAll('.response-input'));

        facade.disable = () => {
            responseInputs.forEach(input => {
                input.setAttribute("disabled", true)
                input.classList.add("disabled")
            })
        };
        facade.enable = () => {
            responseInputs.forEach(input => {
                input.removeAttribute("disabled")
                input.classList.remove("disabled")
            })
        };
        facade.resetResponse = () => {
            responseInputs.forEach(input => {

                input.value = '';
            })
            this.events.trigger('resetResponse');

        };
        facade.showValidationUI = () => {
            const fullyCorrect = facade.isValid(true).correct;
            const partialValidation = facade.isValid(true).partial

            if (fullyCorrect) {
                responseArea.classList.add(CLASS_NAMES.CORRECT)
                responseInputs.forEach((input) => {
                    input.classList.add(CLASS_NAMES.CORRECT)
                })
            }
            else {
                responseArea.classList.add(CLASS_NAMES.INCORRECT);
                responseInputs.forEach((input, index) => {
                    if (partialValidation[index] === true) {
                        input.classList.add(CLASS_NAMES.CORRECT)
                    } else {
                        input.classList.add(CLASS_NAMES.INCORRECT)
                    }
                })
            }

        };
        facade.resetValidationUI = () => {
            responseArea.classList.remove(CLASS_NAMES.CORRECT)
            responseArea.classList.remove(CLASS_NAMES.INCORRECT)
            responseInputs.forEach(input => {
                input.classList.remove(CLASS_NAMES.CORRECT)
                input.classList.remove(CLASS_NAMES.INCORRECT)
            })
            if (this.suggestedAnswersList) {
                this.suggestedAnswersList.reset()
            }
        };
    }

    handleEvents() {
        const { events, init, el } = this;
        const { question } = init
        const facade = init.getFacade()
        const previouslySavedReponses = init.response;

        let responses = previouslySavedReponses || [];

        const responseInputs = Array.from(el.querySelectorAll('.response-input'));

        responseInputs.forEach((input, index) => {
            input.addEventListener('input', (event) => {
                
                responses[index] = event.target.value;
                events.trigger("changed", responses)
                facade.resetValidationUI()
            })
        })


        // "validate" event can be triggered when Check Answer button is clicked or when public method .validate() is called
        // so developer needs to listen to this event to decide if he wants to display the correct answers to user or not
        // options.showCorrectAnswers will tell if correct answers for this question should be display or not.
        // The value showCorrectAnswers by default is the value of showCorrectAnswers inside initOptions object that is used
        // to initialize question app or the value of the options that is passed into public method validate (like question.validate({showCorrectAnswers: false}))
        events.on('validate', options => {
            facade.showValidationUI();
            const { suggestedAnswersList } = this
            const { question } = this.init
            if (options.showCorrectAnswers && suggestedAnswersList) {
                suggestedAnswersList.setAnswers(question.validation.valid_response.value.map((value, index) => {
                    return { index: index, label: value }
                }));
            }
        });

    }
}
