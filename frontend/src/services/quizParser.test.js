import { parseQuizSheet } from './quizParser';
import { Quiz } from '../models/Quiz';
import { Page } from '../models/Page';
import { TextFormInput } from '../models/TextFormInput';
import { NumberFormInput } from '../models/NumberFormInput';
import { MultiChoiceFormInput } from '../models/MultiChoiceFormInput';
import { DropdownFormInput } from '../models/DropdownFormInput';
import { InfoTextFormInput } from '../models/InfoTextFormInput';
import { DisplayHtmlFormInput } from '../models/DisplayHtmlFormInput';
import { DateTimeFormInput } from '../models/DateTimeFormInput';


describe('quizParser', () => {
  it('should parse a simple quiz sheet into a Quiz object', () => {
    const sheetData = [
      { path: 'global.quiz_title', value: 'Test Quiz' },
      { path: 'global.quiz_description', value: 'This is a test quiz' },
      { path: 'global.quiz_direction', value: 'rtl' },
      { path: 'global.response_sheet_id', value: 'response123' },
      { path: 'global.welcome_page_def.page_id', value: 'welcome' },
      { path: 'global.welcome_page_def.page_title', value: 'Welcome Page' },
      { path: 'global.welcome_page_def.page_description', value: 'Welcome to the quiz!' },
      { path: 'question.welcome.Q1.question_id', value: 'name_q' },
      { path: 'question.welcome.Q1.question', value: 'What is your name?' },
      { path: 'question.welcome.Q1.question_type', value: 'text' },
      { path: 'question.welcome.Q1.input_context', value: 'input' },
      { path: 'question.welcome.Q1.question_is_required', value: 'TRUE' },
      { path: 'question.welcome.Q2.id', value: 'info_text_1' },
      { path: 'question.welcome.Q2.text', value: 'Please enter your details below.' },
      { path: 'question.welcome.Q2.type', value: 'info_text' },
      { path: 'question.welcome.Q3.id', value: 'html_block_1' },
      { path: 'question.welcome.Q3.html', value: '<div><strong>Notice:</strong> Read carefully.</div>' },
      { path: 'question.welcome.Q3.type', value: 'display_html' },

      { path: 'question.quiz_page_def.page_id', value: 'quiz' },
      { path: 'question.quiz_page_def.page_title', value: 'Quiz Questions' },
      { path: 'question.quiz_page_def.page_description', value: 'Answer carefully' },
      { path: 'question.quiz.Q3.question_id', value: 'age_q' },
      { path: 'question.quiz.Q3.question', value: 'What is your age?' },
      { path: 'question.quiz.Q3.question_type', value: 'number' },
      { path: 'question.quiz.Q3.question_placeholder', value: 'Enter your age' },
      { path: 'question.quiz.Q3.question_remember_key', value: 'age' },
      { path: 'question.quiz.Q3.question_default_answer', value: '18' },
      { path: 'question.quiz.Q3.input_context', value: 'question' },
      { path: 'question.quiz.Q3.question_is_required', value: 'FALSE' },
      { path: 'question.quiz.Q4.question_id', value: 'multichoice_q' },
      { path: 'question.quiz.Q4.question', value: 'Select your favorite colors:' },
      { path: 'question.quiz.Q4.question_type', value: 'multi_choice' },
      { path: 'question.quiz.Q4.question_option', value: 'Red' },
      { path: 'question.quiz.Q4.question_option', value: 'Blue' },
      { path: 'question.quiz.Q4.question_option', value: 'Green' },
      { path: 'question.quiz.Q4.question_is_required', value: 'TRUE' },
      { path: 'question.quiz.Q6.question_id', value: 'dropdown_q' },
      { path: 'question.quiz.Q6.question', value: 'Select your department:' },
      { path: 'question.quiz.Q6.question_type', value: 'dropdown' },
      { path: 'question.quiz.Q6.question_option', value: 'Engineering' },
      { path: 'question.quiz.Q6.question_option', value: 'Operations' },
      { path: 'question.quiz.Q6.question_option', value: 'Logistics' },
      { path: 'question.quiz.Q6.question_is_required', value: 'TRUE' },
      { path: 'question.quiz.Q5.question_id', value: 'datetime_q' },
      { path: 'question.quiz.Q5.question', value: 'When did you complete this?' },
      { path: 'question.quiz.Q5.question_type', value: 'datetime' },
      { path: 'question.quiz.Q5.question_is_required', value: 'TRUE' },
    ];

    const quiz = parseQuizSheet(sheetData);

    expect(quiz).toBeInstanceOf(Quiz);
    expect(quiz.title).toBe('Test Quiz');
    expect(quiz.description).toBe('This is a test quiz');
    expect(quiz.responseSheetId).toBe('response123');
    expect(quiz.direction).toBe('rtl');

    const pages = quiz.getPages();
    expect(pages).toHaveLength(2);

    // Test Welcome Page
    const welcomePage = pages.find(p => p.id === 'welcome');
    expect(welcomePage).toBeInstanceOf(Page);
    expect(welcomePage.title).toBe('Welcome Page');
    expect(welcomePage.description).toBe('Welcome to the quiz!');
    expect(welcomePage.getElements()).toHaveLength(3);

    const nameQuestion = welcomePage.getElements().find(e => e.id === 'name_q');
    expect(nameQuestion).toBeInstanceOf(TextFormInput);
    expect(nameQuestion.text).toBe('What is your name?');
    expect(nameQuestion.category).toBe('question');
    expect(nameQuestion.subType).toBe('text');
    expect(nameQuestion.inputContext).toBe('input');
    expect(nameQuestion.isRequired).toBe(true);

    const infoText = welcomePage.getElements().find(e => e.id === 'info_text_1');
    expect(infoText).toBeInstanceOf(InfoTextFormInput);
    expect(infoText.text).toBe('Please enter your details below.');
    expect(infoText.category).toBe('info_text');
    expect(infoText.subType).toBe('info_text');
    expect(infoText.isRequired).toBe(false); // InfoTextFormInput is never required

    const htmlBlock = welcomePage.getElements().find(e => e.id === 'html_block_1');
    expect(htmlBlock).toBeInstanceOf(DisplayHtmlFormInput);
    expect(htmlBlock.html).toBe('<div><strong>Notice:</strong> Read carefully.</div>');
    expect(htmlBlock.category).toBe('display_html');
    expect(htmlBlock.subType).toBe('display_html');

    // Test Quiz Page
    const quizPage = pages.find(p => p.id === 'quiz');
    expect(quizPage).toBeInstanceOf(Page);
    expect(quizPage.title).toBe('Quiz Questions');
    expect(quizPage.description).toBe('Answer carefully');
    expect(quizPage.getElements()).toHaveLength(4);

    const ageQuestion = quizPage.getElements().find(e => e.id === 'age_q');
    expect(ageQuestion).toBeInstanceOf(NumberFormInput);
    expect(ageQuestion.text).toBe('What is your age?');
    expect(ageQuestion.category).toBe('question');
    expect(ageQuestion.subType).toBe('number');
    expect(ageQuestion.placeholder).toBe('Enter your age');
    expect(ageQuestion.rememberKey).toBe('age');
    expect(ageQuestion.rememberLastAnswer).toBe(true);
    expect(ageQuestion.defaultAnswer).toBe('18');
    expect(ageQuestion.inputContext).toBe('question');
    expect(ageQuestion.isRequired).toBe(false);

    const multichoiceQuestion = quizPage.getElements().find(e => e.id === 'multichoice_q');
    expect(multichoiceQuestion).toBeInstanceOf(MultiChoiceFormInput);
    expect(multichoiceQuestion.text).toBe('Select your favorite colors:');
    expect(multichoiceQuestion.category).toBe('question');
    expect(multichoiceQuestion.subType).toBe('multi_choice');
    expect(multichoiceQuestion.options).toEqual(['Red', 'Blue', 'Green']);
    expect(multichoiceQuestion.isRequired).toBe(true);

    const dropdownQuestion = quizPage.getElements().find(e => e.id === 'dropdown_q');
    expect(dropdownQuestion).toBeInstanceOf(DropdownFormInput);
    expect(dropdownQuestion.text).toBe('Select your department:');
    expect(dropdownQuestion.category).toBe('question');
    expect(dropdownQuestion.subType).toBe('dropdown');
    expect(dropdownQuestion.options).toEqual(['Engineering', 'Operations', 'Logistics']);
    expect(dropdownQuestion.isRequired).toBe(true);

    const dateTimeQuestion = quizPage.getElements().find(e => e.id === 'datetime_q');
    expect(dateTimeQuestion).toBeInstanceOf(DateTimeFormInput);
    expect(dateTimeQuestion.text).toBe('When did you complete this?');
    expect(dateTimeQuestion.category).toBe('question');
    expect(dateTimeQuestion.subType).toBe('datetime');
    expect(dateTimeQuestion.isRequired).toBe(true);
  });

  it('should handle missing global properties gracefully', () => {
    const sheetData = [
      { path: 'global.welcome_page_def.page_id', value: 'welcome' },
      { path: 'global.welcome_page_def.page_title', value: 'Welcome Page' },
      { path: 'question.welcome.Q1.question_id', value: 'name_q' },
      { path: 'question.welcome.Q1.question', value: 'What is your name?' },
      { path: 'question.welcome.Q1.question_type', value: 'text' },
    ];
    const quiz = parseQuizSheet(sheetData);
    expect(quiz.title).toBe('');
    expect(quiz.description).toBe('');
    expect(quiz.responseSheetId).toBe('');
  });

  it('should handle quizzes with no pages', () => {
    const sheetData = [
      { path: 'global.quiz_title', value: 'Empty Quiz' },
    ];
    const quiz = parseQuizSheet(sheetData);
    expect(quiz.getPages()).toHaveLength(0);
  });

  it('should handle pages with no elements', () => {
    const sheetData = [
      { path: 'global.quiz_title', value: 'Quiz' },
      { path: 'global.empty_page_def.page_id', value: 'empty' },
      { path: 'global.empty_page_def.page_title', value: 'Empty Page' },
    ];
    const quiz = parseQuizSheet(sheetData);
    const emptyPage = quiz.getPages().find(p => p.id === 'empty');
    expect(emptyPage.getElements()).toHaveLength(0);
  });
});
