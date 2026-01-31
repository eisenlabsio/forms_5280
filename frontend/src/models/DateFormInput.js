import { FormInput } from './FormInput';

export class DateFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'date', isRequired);
        this.rightAnswer = null;
    }
}
