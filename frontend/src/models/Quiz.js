export class Quiz {
    constructor() {
        this.title = '';
        this.description = '';
        this.responseSheetId = '';
        this.direction = 'ltr';
        this.pages = {};
    }

    addPage(page) {
        this.pages[page.id] = page;
    }

    getPage(pageId) {
        return this.pages[pageId];
    }
    
    getPages() {
        return Object.values(this.pages);
    }
}
