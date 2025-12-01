import Question from "./question/index";
import "../scss/main.scss";

/*global LearnosityAmd*/
LearnosityAmd.define([], function () {
  return {
    Question, // the shorthand for Question: Question
  };
});
