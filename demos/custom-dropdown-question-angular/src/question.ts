/**
 * Question Entry Point
 *
 * AMD module wrapper for the Question class.
 * This file is loaded by Learnosity's custom question framework.
 */

import Question from './app/question/index';

// Define AMD module for Learnosity
declare const LearnosityAmd: any;

LearnosityAmd.define([], function () {
    return {
        Question
    };
});
