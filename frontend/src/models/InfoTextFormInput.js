import { FormInput } from './FormInput';

export class InfoTextFormInput extends FormInput {
    constructor(id, text) {
        super(id, text, 'info_text', 'info_text', false); // Info text is not typically required
        this.text = text; // Keep text property for consistency with previous usage
    }
}
