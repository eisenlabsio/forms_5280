export class Quiz {
    constructor() {
        this.title = '';
        this.description = '';
        this.responseSheetId = '';
        this.direction = 'ltr';
        this.fontScaleConfig = null;
        this.testEnabled = false;
        this.minScore = null;
        this.testTitle = '';
        this.testDescription = '';
        this.testShowIcons = true;
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
