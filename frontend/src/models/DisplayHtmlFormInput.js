import { FormInput } from './FormInput';

export class DisplayHtmlFormInput extends FormInput {
    constructor(id, html) {
        super(id, '', 'display_html', 'display_html', false);
        this.html = html || '';
    }
}
