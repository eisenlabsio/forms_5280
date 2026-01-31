import { FormInput } from './FormInput';

export class MultiChoiceFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'multi_choice', isRequired);
        this.options = [];
        this.rightAnswer = [];
    }

    addOption(option) {
        this.options.push(option);
    }
}
