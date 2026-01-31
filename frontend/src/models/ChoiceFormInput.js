import { FormInput } from './FormInput';

export class ChoiceFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'choice', isRequired);
        this.options = [];
        this.rightAnswer = '';
    }

    addOption(option) {
        this.options.push(option);
    }
}
