import { FormInput } from './FormInput';

export class TimeFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'time', isRequired);
        this.rightAnswer = null;
    }
}
