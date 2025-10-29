/**
 * Scorer Class
 *
 * Handles server-side validation logic for the custom dropdown question.
 * Compares student responses against the valid_response configuration.
 */

interface QuestionData {
    valid_response: Record<string, string>;
    [key: string]: any;
}

interface ResponseData {
    [index: string]: string;
}

export default class Scorer {
    private question: QuestionData;
    private response: ResponseData;

    constructor(question: QuestionData, response: ResponseData) {
        this.question = question;
        this.response = response || {};
    }

    /**
     * Validates if the student's response is correct
     * @returns true if all dropdown selections match the valid response
     */
    isValid(): boolean {
        return Object.entries(this.question.valid_response).every(([index, value]) => {
            return this.response[index] === value;
        });
    }

    /**
     * Validates individual dropdown responses
     * @returns Object mapping each dropdown index to its validity
     */
    validateIndividualResponses(): Record<string, boolean> | null {
        // TODO: Implement individual response validation
        return null;
    }

    /**
     * Calculates the score for this question
     * @returns The score value
     */
    score(): number {
        // TODO: Implement scoring logic
        return 0;
    }

    /**
     * Returns the maximum possible score for this question
     * @returns The maximum score value
     */
    maxScore(): number {
        // TODO: Implement max score calculation
        return 0;
    }

    /**
     * Determines if the response can be validated
     * @returns true if the question is scorable
     */
    canValidateResponse(): boolean {
        return true;
    }
}

// Export for CommonJS compatibility
export { Scorer };
