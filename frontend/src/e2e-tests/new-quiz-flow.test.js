const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

jest.setTimeout(180000);

const BASE_URL = 'http://localhost:3000/';
const NEW_TEST_QUIZ_SHEET_ID = 'new_test_quiz_sheet_id';

const FIXTURES_DIR = path.resolve(__dirname, '../../../quiz_data');
const NEW_TEST_QUIZ_CSV = fs.readFileSync(path.join(FIXTURES_DIR, 'new_test_quiz_path_value.csv'), 'utf8');

const MASTER_QUIZ_CSV = `path,value
global.quiz_title,My Awesome Quizzes Collection
global.quiz_description,Explore a variety of quizzes on different subjects.
quizzes.0.sheet_id,${NEW_TEST_QUIZ_SHEET_ID}
quizzes.0.title,My New Test Quiz
quizzes.0.description,A simple quiz for testing.
`;
const CONTENT_SHEET_CSV = `"Key","English","Hebrew"
"app_title","Quiz Application","Quiz Application"
`;
const CONTENT_SHEET_ID = '1kHLhA3I90fttIQL40vkK3HxTEBU5eagVVRy12fzNzMo';
const MASTER_SHEET_ID = '117kB62YhkTV0cby-kYomINl0yKd5F4MEz4Fm1Hx9XNM';

const clickQuizCardByTitle = async (page, title) => {
  const cards = await page.$$('.quiz-card');
  for (const card of cards) {
    const cardTitle = await card.$eval('h3', el => el.textContent);
    if (cardTitle && cardTitle.includes(title)) {
      await card.click();
      return;
    }
  }
  throw new Error(`${title} quiz card not found`);
};

describe('New Quiz Flow E2E Test', () => {
  let page;

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(7000);
    page.setDefaultNavigationTimeout(7000);

    page.on('console', message => {
      console.log(`Browser Console: ${message.text()}`);
    });

    if (global.e2eMode === 'local') {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = request.url();
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method() === 'OPTIONS') {
          request.respond({ status: 204, headers: corsHeaders, body: '' });
          return;
        }

        if (url.includes(MASTER_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: MASTER_QUIZ_CSV });
          return;
        }

        if (url.includes(NEW_TEST_QUIZ_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: NEW_TEST_QUIZ_CSV });
          return;
        }

        if (url.includes(CONTENT_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: CONTENT_SHEET_CSV });
          return;
        }

        request.continue();
      });
    } else {
        await page.setRequestInterception(false);
    }

    const targetUrl = `${BASE_URL}?sheetId=${MASTER_SHEET_ID}`;
    console.log(`Navigating to: ${targetUrl}`);
    await page.goto(targetUrl);

    await page.waitForFunction(
      () => {
        const loadingMessage = document.querySelector('.loading-message');
        const errorMessage = document.querySelector('.error-message');
        const quizSelectionTitle = document.querySelector('div.quiz-selection h2');
        return (!loadingMessage && !errorMessage && quizSelectionTitle && quizSelectionTitle.textContent.length > 0);
      },
      { timeout: 7000 }
    );
  });

  afterEach(async () => {
    await page.close();
  });

  test('should load the new quiz, answer a question and verify the answer', async () => {
    await page.waitForSelector('div.quiz-selection h2', { timeout: 7000 });
    await clickQuizCardByTitle(page, 'My New Test Quiz');

    await page.waitForFunction(
      () => {
        const element = document.querySelector('.question-block .question-text');
        return element && element.textContent.length > 0;
      },
      { timeout: 7000 }
    );

    const questionText = await page.$eval('.question-block .question-text', el => el.textContent);
    expect(questionText).not.toBeNull();
    expect(questionText).toEqual('1. What is 1+1?');

    const textInputSelector = '.question-block[data-element-id="Q1"] input[type="text"]';
    await page.waitForSelector(textInputSelector, { timeout: 7000 });
    await page.type(textInputSelector, '2');

    const nextButtonSelector = '.next-button';
    if (await page.$(nextButtonSelector)) {
      await page.click(nextButtonSelector);
    }

    // This quiz only has one page, so submit should be available.
    await page.waitForSelector('#submit-quiz', { timeout: 7000 });

    const prevButtonSelector = '.prev-button';
    await page.click(prevButtonSelector); // Click the previous button
    await page.waitForSelector(textInputSelector, { timeout: 7000 });
    const returnedAnswer = await page.$eval(textInputSelector, el => el.value);
    expect(returnedAnswer).toBe('2');
  });
});
