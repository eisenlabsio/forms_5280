import fs from 'fs';
import path from 'path';
import { fetchMasterSheet, fetchQuiz } from './googleSheets';
import { Quiz } from '../models/Quiz';
import { Page } from '../models/Page';
import { TextFormInput } from '../models/TextFormInput';

const FIXTURES_DIR = path.resolve(__dirname, '../../../quiz_data');
const MASTER_FIXTURE_CSV = fs.readFileSync(path.join(FIXTURES_DIR, 'master_quiz_list_path_value_example.csv'), 'utf8');
const HISTORY_FIXTURE_CSV = fs.readFileSync(path.join(FIXTURES_DIR, 'history_challenge_quiz_path_value.csv'), 'utf8');

describe('googleSheets', () => {
  // Directly replace global fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear(); // Clear all mock calls and implementations before each test
  });

  afterEach(() => {
    // No need for mockFetch.mockRestore() if we directly replaced global.fetch
    // and clear mocks in beforeEach.
  });

  it('fetchMasterSheet should return master quiz data and available quizzes', async () => {
    const mockMasterCsv = `path,value
global.quiz_title,Master Title
global.quiz_description,Master Description
quizzes.0.sheet_id,quiz123
quizzes.0.title,Quiz One
quizzes.0.description,Description One
quizzes.1.sheet_id,quiz456
quizzes.1.title,Quiz Two
quizzes.1.description,Description Two`;

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockMasterCsv),
      })
    );

    const result = await fetchMasterSheet('masterSheetId123');

    expect(result).toEqual({
      masterQuizTitle: 'Master Title',
      masterQuizDescription: 'Master Description',
      masterDirection: 'ltr',
      availableQuizzes: [ // Expect an array now
        { sheet_id: 'quiz123', title: 'Quiz One', description: 'Description One' },
        { sheet_id: 'quiz456', title: 'Quiz Two', description: 'Description Two' },
      ],
    });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('masterSheetId123'));
  });

  it('fetchQuiz should return a Quiz object', async () => {
    const mockQuizCsv = `path,value
global.quiz_title,My Awesome Quiz
global.quiz_description,A quiz to test your knowledge.
global.response_sheet_id,responseSheetId789
global.page1_page_def.page_id,page1
global.page1_page_def.page_title,First Page
question.page1.Q1.question_id,q1_name
question.page1.Q1.question,What is your name?
question.page1.Q1.question_type,text
question.page1.Q1.question_is_required,TRUE`;

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockQuizCsv),
      })
    );

    const quiz = await fetchQuiz('quizSheetId123');

    expect(quiz).toBeInstanceOf(Quiz);
    expect(quiz.title).toBe('My Awesome Quiz');
    expect(quiz.description).toBe('A quiz to test your knowledge.');
    expect(quiz.responseSheetId).toBe('responseSheetId789');

    const pages = quiz.getPages();
    expect(pages).toHaveLength(1);
    const page1 = pages[0];
    expect(page1).toBeInstanceOf(Page);
    expect(page1.id).toBe('page1');
    expect(page1.title).toBe('First Page');

    const elements = page1.getElements();
    expect(elements).toHaveLength(1);
    const q1 = elements[0];
    expect(q1).toBeInstanceOf(TextFormInput);
    expect(q1.id).toBe('q1_name');
    expect(q1.text).toBe('What is your name?');
    expect(q1.category).toBe('question');
    expect(q1.subType).toBe('text');
    expect(q1.isRequired).toBe(true);
  });

  it('fetchMasterSheet should parse a local CSV fixture', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(MASTER_FIXTURE_CSV),
      })
    );

    const result = await fetchMasterSheet('localFixture');

    expect(result.masterQuizTitle).toBe('My Awesome Quizzes Collection');
    expect(result.masterDirection).toBe('ltr');
    expect(result.masterQuizDescription).toBe('Explore a variety of quizzes on different subjects.');
    expect(result.availableQuizzes).toEqual([
      { sheet_id: 'science_sheet_id', title: 'Science Basics', description: 'Test your knowledge of fundamental science.' },
      { sheet_id: 'history_sheet_id', title: 'History Challenge', description: 'Test your knowledge of significant historical events and figures across different eras.' },
    ]);
  });

  it('fetchQuiz should parse a local CSV fixture without sheet access', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(HISTORY_FIXTURE_CSV),
      })
    );

    const quiz = await fetchQuiz('localHistoryFixture');

    expect(quiz).toBeInstanceOf(Quiz);
    expect(quiz.title).toBe('History Challenge');
    expect(quiz.responseSheetId).toBe('history_response_sheet_id');
    expect(quiz.getPages().length).toBeGreaterThan(0);
  });

  it('should handle fetch errors gracefully for fetchMasterSheet', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );

    const result = await fetchMasterSheet('nonExistentSheet');
    expect(result.masterQuizTitle).toBe('Quiz Selection');
    expect(result.availableQuizzes).toEqual([]);
    // expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors gracefully for fetchQuiz', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      })
    );

    const result = await fetchQuiz('errorSheet');
    expect(result).toBeNull();
    // expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
