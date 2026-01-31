import { FormInput } from './FormInput';

export class SignatureFormInput extends FormInput {
    constructor(id, text, isRequired) {
        super(id, text, 'question', 'signature', isRequired);
        this.rightAnswer = ''; // Or whatever is appropriate for a signature
    }
}
