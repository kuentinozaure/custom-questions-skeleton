export default class Scorer {
  constructor(question, response) {
    this.question = question;
    this.response = response;
  }

  /**
   * Check if the current question's response is valid or not
   * (Required)
   * @returns {boolean}
   */
  isValid() {
    // TODO: Requires implementation
    const { valid_response } = this.question;

    if (JSON.stringify(valid_response) !== JSON.stringify(this.response)) {
      return false;
    }

    return true;
  }

  /**
   * Returns an object displaying the validation state of each individual item inside the stored response
   * For example:
   * The student response value is: { min: 10, max: 20 } and our correct answer is { min: 10, max: 30 }
   * Then we expect the result of this validateIndividualResponses will be:
   * { min: true, max: false }
   * @returns {{}|null}
   */
  validateIndividualResponses() {
    // TODO: Requires implementation
    // console.log("response", this.response);
    console.log("validateIndividualResponses not implemented yet");
    return null;
  }

  /**
   * Returns the score of the stored response
   * @returns {number|null}
   */
  score() {
    // TODO: Requires implementation
    // console.log("response", this.response);
    return 0;
  }

  /**
   * Returns the possible max score of the stored response
   * @returns {number}
   */
  maxScore() {
    // TODO: Requires implementation
    // console.log("response", this.response);
    return 0;
  }

  /**
   * Check if the current question is scorable or not.
   * For example:
   * - If there is no valid response data set in the question, this method should return false
   * - If this question type is not scorable (like an essay or open ended question) then this will return false
   * @returns {boolean}
   */
  canValidateResponse() {
    return true;
  }
}
