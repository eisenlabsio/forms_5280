import { FormInput } from './FormInput';

export class DropdownFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'dropdown', isRequired);
        this.options = [];
        this.rightAnswer = '';
    }

    addOption(option) {
        this.options.push(option);
    }
}
