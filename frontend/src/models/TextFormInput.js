import { FormInput } from './FormInput';

export class TextFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'text', isRequired);
        this.rightAnswer = '';
        this.validationRegex = '';
    }
}
