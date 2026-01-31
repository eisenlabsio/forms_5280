import { FormInput } from './FormInput';

export class PhoneFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'phone', isRequired);
        this.rightAnswer = '';
        this.validationRegex = '^05\\d-?[1-9]\\d{6}$'; // Updated regex provided by user
    }
}
