export class Page {
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.elements = {};
    }

    addElement(element) {
        this.elements[element.id] = element;
    }

    getElement(elementId) {
        return this.elements[elementId];
    }

    getElements() {
        return Object.values(this.elements);
    }
}
