export class FormInput {
    constructor(id, text, category, subType, isRequired) {
        if (this.constructor === FormInput) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.id = id;
        this.text = text;
        this.category = category; // e.g., 'question', 'info_text'
        this.subType = subType;   // e.g., 'text', 'number', 'info_text'
        this.isRequired = isRequired;
    }
}
