/**
 * Scorer Entry Point
 *
 * AMD module wrapper for the Scorer class.
 * This file is loaded by Learnosity for server-side validation.
 */

import Scorer from './app/scorer/index';

// Define AMD module for Learnosity
declare const LearnosityAmd: any;

LearnosityAmd.define([], function () {
    return {
        Scorer
    };
});
