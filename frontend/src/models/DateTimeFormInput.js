import { FormInput } from './FormInput';

export class DateTimeFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'datetime', isRequired);
        this.rightAnswer = null;
    }
}
