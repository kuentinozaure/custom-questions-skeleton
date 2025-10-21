console.log(`
==============================================================================================
THE SCRIPT BELOW IS BEING USED TO TEST THE SERVER SIDE SCORING FOR YOUR CUSTOM QUESTION
----
Update the questionResponseJson with your question json & response
==============================================================================================
`);

// QuestionResponseJson that will be used to test your Scorer logic
const questionResponseJson = {
    question: {
        "type": "custom",
        "stimulus": "Fill in the blanks",
        "is_math": true,
        "validation": {
            "valid_response": {
                "value": [
                    {
                        "value": "2",
                        "method": "equivSymbolic"
                    },
                    {
                        "value": "4",
                        "method": "equivSymbolic"
                    }
                ],
                "score": 1
            }
        },
        "template": "1+1 = <span class=\"custom-response-placeholder\">{{response}}</span>&nbsp;2 + 2 =&nbsp;<span class=\"custom-response-placeholder\">{{response}}</span>&nbsp;",
        "js": {
            "question": "/dist/question.js",
            "scorer": "/dist/scorer.js"
        },
        "css": "/dist/question.css",
        "instant_feedback": true,
        "custom_type": "custom_question_skeleton",
        "version": "v1.0.0"
    },
    response: {
        "value": [
            "2",
            "4"
        ],
        "type": "object",
        "apiVersion": "v2.230.0",
        "revision": 1,
        "feedbackAttemptsCount": 1
    }
};

// Path to the scorer file that you need to debug
const scorerUrl = './dist/scorer.js';

// Mock LearnosityAmd object that will be used to transform the scorer into a class that we can use to debug later on
global.LearnosityAmd = {
    define: ([], resolveCallback) => {
        if (!resolveCallback) {
            throw new Error('No callback to resolve Scorer exists');
        }

        const result = resolveCallback();

        if (!result.Scorer) {
            throw new Error('No Scorer class');
        }

        runTest(result.Scorer, questionResponseJson.question, questionResponseJson.response);
    }
};

// Load the Scorer
require(scorerUrl);

function runTest(Scorer, question, response) {
    const scorer = new Scorer(question, response);

    console.log(`
**************
TEST OUTPUT
**************
    `);

    console.log('isValid:', scorer.isValid());
    console.log('validateIndividualResponses:', scorer.validateIndividualResponses());
    console.log('score:', scorer.score());
    console.log('score:', scorer.maxScore());
}
