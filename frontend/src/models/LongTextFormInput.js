import { FormInput } from './FormInput';

export class LongTextFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'long_text', isRequired);
        this.rightAnswer = '';
    }
}

