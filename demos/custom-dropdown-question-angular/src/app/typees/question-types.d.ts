
export interface DropdownConfig {
  placeholder?: string;
  options: string[];
}

export interface QuestionData {
  custom_dropdown_template: string;
  dropdown_configs?: DropdownConfig[];
  [key: string]: any;
}

export interface ResponseValue {
  [index: string]: string;
}

export interface ValidationStates {
  [index: string]: 'correct' | 'incorrect' | null;
}
