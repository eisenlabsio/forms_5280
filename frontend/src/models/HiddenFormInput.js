import { FormInput } from './FormInput';

export class HiddenFormInput extends FormInput {
    constructor(id) {
        super(id, '', 'hidden', 'hidden', false);
        this.hiddenValue = '';
        this.hiddenValueJs = '';
    }
}
