import { FormInput } from './FormInput';

export class NumberFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'number', isRequired);
        this.rightAnswer = null;
        this.validationRegex = '';
    }
}
