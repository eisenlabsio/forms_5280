const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

console.log('Jest process.cwd():', process.cwd()); // Log Jest's CWD

jest.setTimeout(180000);

const MASTER_SHEET_ID = '117kB62YhkTV0cby-kYomINl0yKd5F4MEz4Fm1Hx9XNM';
const CONTENT_SHEET_ID = '1kHLhA3I90fttIQL40vkK3HxTEBU5eagVVRy12fzNzMo';
const HISTORY_SHEET_ID = '1H5gy4tlJqZmyLSEREx4jTR9UgzAbY9xzUxicCtnmiKY';
const SCIENCE_SHEET_ID = '14p4zOnE2ZRDW4OJVqiC3PpGGDoek0dxW_jrChxutbF8';
const BASE_URL = 'http://localhost:3000/'; // Define base URL

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e-tests'); // Absolute path from current working directory
const FIXTURES_DIR = path.resolve(__dirname, '../../../quiz_data');
const HISTORY_QUIZ_CSV = fs.readFileSync(path.join(FIXTURES_DIR, 'history_challenge_quiz_path_value.csv'), 'utf8');
const parsedHistoryQuizCsv = Papa.parse(HISTORY_QUIZ_CSV, { header: true, skipEmptyLines: true }).data;
const historyResponseSheetId = parsedHistoryQuizCsv.find(row => row.path === 'global.response_sheet_id')?.value;

const SCIENCE_QUIZ_CSV = fs.readFileSync(path.join(FIXTURES_DIR, 'science_basics_quiz_path_value.csv'), 'utf8');
const SIGNATURE_QUIZ_CSV = `path,value
global.quiz_title,Signature Test Quiz
global.quiz_description,A quiz to test signature functionality.
global.response_sheet_id,dummy_signature_response_id
global.signature_page_def.page_id,signature_page
global.signature_page_def.page_title,Signature Page
global.signature_page_def.page_description,Please sign below.
question.signature_page.INFO1.type,info_text
question.signature_page.INFO1.text,Please sign below to confirm.
question.signature_page.SIG1.question,Your Signature:
question.signature_page.SIG1.question_type,signature
question.signature_page.SIG1.question_is_required,TRUE`;
const SIGNATURE_SHEET_ID = '123signaturetestID'; // A new mock sheet ID for the signature quiz

const MASTER_QUIZ_CSV = `path,value
global.quiz_title,My Awesome Quizzes Collection
global.quiz_description,Explore a variety of quizzes on different subjects.
quizzes.0.sheet_id,${SCIENCE_SHEET_ID}
quizzes.0.title,Science Basics
quizzes.0.description,Test your knowledge of fundamental science.
quizzes.1.sheet_id,${HISTORY_SHEET_ID}
quizzes.1.title,History Challenge
quizzes.1.description,Test your knowledge of significant historical events and figures across different eras.
quizzes.2.sheet_id,${SIGNATURE_SHEET_ID}
quizzes.2.title,Signature Test Quiz
quizzes.2.description,A quiz to test signature functionality.`;
const CONTENT_SHEET_CSV = `"Key","English","Hebrew"\n"app_title","Quiz Application","Quiz Application"\n`;
const GAS_RESPONSE = JSON.stringify({ success: true, message: 'Quiz response recorded successfully.' });
const isSheetCsvRequest = (url, sheetId) => url.includes(sheetId) && url.includes('export?format=csv');
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

describe('Quiz Application E2E Tests', () => {
  let submissionTimestamp;
  let page; // Declare page in a higher scope for beforeEach and afterEach

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(7000);
    page.setDefaultNavigationTimeout(7000);

    // Add this console listener
    page.on('console', message => {
      console.log(`Browser Console: ${message.text()}`);
    });

    await page.evaluateOnNewDocument(() => {
      window.__lastAlert = null;
      window.alert = (message) => {
        window.__lastAlert = message;
      };
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

        if (isSheetCsvRequest(url, MASTER_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: MASTER_QUIZ_CSV });
          return;
        }
        if (isSheetCsvRequest(url, HISTORY_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: HISTORY_QUIZ_CSV });
          return;
        }
        if (isSheetCsvRequest(url, SCIENCE_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: SCIENCE_QUIZ_CSV });
          return;
        }
        if (isSheetCsvRequest(url, SIGNATURE_SHEET_ID)) {
          request.respond({ status: 200, headers: corsHeaders, contentType: 'text/csv', body: SIGNATURE_QUIZ_CSV });
          return;
        }
        if (isSheetCsvRequest(url, CONTENT_SHEET_ID)) {
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

  beforeAll(async () => {
    // Ensure screenshots directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      console.log('Creating screenshot directory:', SCREENSHOTS_DIR);
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });


  test('should successfully navigate to the quiz selection page with sheetId', async () => {
    await page.waitForSelector('body');
    const title = await page.title();
    expect(title).toBe('React App');

    // Ensure the quiz selection title eventually appears
    await page.waitForSelector('div.quiz-selection h2', { timeout: 7000 });
    const masterQuizTitle = await page.$eval('div.quiz-selection h2', el => el.textContent);
    expect(masterQuizTitle).not.toBeNull();
    // Assuming the real sheet will have "My Awesome Quizzes Collection" as title
    expect(masterQuizTitle).toBe('My Awesome Quizzes Collection');
  });

  test('should load the main page and display all quizzes from master sheet', async () => {
    await page.waitForSelector('div.quiz-selection h2', { timeout: 7000 });

    const parseCsv = (csv) => {
        console.log('DEBUG: CSV being parsed:', csv);
        console.log('DEBUG: typeof CSV:', typeof csv);
        return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
    };

    const masterQuizData = parseCsv(MASTER_QUIZ_CSV);
    const quizSheetIds = masterQuizData
        .filter(row => row.path && row.path.endsWith('.sheet_id'))
        .map(row => row.value);

    const expectedQuizTitles = [];
    const quizCsvMap = {
        [HISTORY_SHEET_ID]: HISTORY_QUIZ_CSV,
        [SCIENCE_SHEET_ID]: SCIENCE_QUIZ_CSV,
        [SIGNATURE_SHEET_ID]: SIGNATURE_QUIZ_CSV,
    };

    for (const sheetId of quizSheetIds) {
        const quizCsv = quizCsvMap[sheetId];
        const quizData = parseCsv(quizCsv);
        const titleRow = quizData.find(row => row.path === 'global.quiz_title');
        if (titleRow) {
            expectedQuizTitles.push(titleRow.value);
        }
    }
    const displayedCardTitles = await page.$$eval('.quiz-card h3', cards => cards.map(c => c.textContent));
    expect(displayedCardTitles.length).toBe(expectedQuizTitles.length);
    expect(displayedCardTitles).toEqual(expect.arrayContaining(expectedQuizTitles));
  });

  test('should allow selecting an individual quiz', async () => {
    console.log('Test: should allow selecting an individual quiz - Starting.');
    await page.waitForSelector('.quiz-card h3', { timeout: 7000 });
    console.log('Test: should allow selecting an individual quiz - Quiz card titles found.');
    await clickQuizCardByTitle(page, 'History Challenge');
    console.log('Test: should allow selecting an individual quiz - History Challenge quiz card clicked.');

    await page.waitForFunction(
      () => {
        const element = document.querySelector('.question-block .question-text');
        return element && element.textContent.length > 0;
      },
      { timeout: 7000 }
    );
    console.log('Test: should allow selecting an individual quiz - Question block found via waitForFunction.');

    const questionText = await page.$eval('.question-block .question-text', el => el.textContent);
    expect(questionText).not.toBeNull();
    expect(questionText).toEqual('1. In which year did the Roman Empire fall?');
    console.log('Test: should allow selecting an individual quiz - Assertions passed.');
  }, 7000);

  test('should navigate through questions and input text answer', async () => {
    // Since each test is isolated, we need to re-navigate and select the quiz
    await page.goto(`${BASE_URL}?sheetId=${MASTER_SHEET_ID}`);
    await page.waitForFunction(
      () => {
        const loadingMessage = document.querySelector('.loading-message');
        const errorMessage = document.querySelector('.error-message');
        const quizSelectionTitle = document.querySelector('div.quiz-selection h2');
        return (!loadingMessage && !errorMessage && quizSelectionTitle && quizSelectionTitle.textContent.length > 0);
      },
      { timeout: 7000 }
    );
            await page.waitForSelector('div.quiz-selection h2', { timeout: 7000 });
            await clickQuizCardByTitle(page, 'History Challenge');    // No waitForNavigation needed here, relying on waitForFunction for UI element

    const numberInputSelector = '.question-block[data-element-id="H1"] input[type="number"]';
    await page.waitForSelector(numberInputSelector, { timeout: 7000 });
    await page.type(numberInputSelector, '1476');

    const textInputSelector = '.question-block[data-element-id="H2"] input[type="text"]';
    await page.waitForSelector(textInputSelector, { timeout: 7000 });
    await page.type(textInputSelector, 'Qin Shi Huang');

    const nextButtonSelector = '.next-button';
    await page.waitForSelector(nextButtonSelector, { timeout: 7000 });
    await page.click(nextButtonSelector);

    await page.waitForFunction(
      () => {
        const element = document.querySelector('.question-block[data-element-id="W1"] .question-text');
        return element && element.textContent.length > 0;
      },
      { timeout: 7000 }
    );
    const newQuestionText = await page.$eval('.question-block[data-element-id="W1"] .question-text', el => el.textContent);
    expect(newQuestionText).not.toBeNull();
    expect(newQuestionText).toContain('Which countries were the main Axis powers in WWII?');

    const prevButtonSelector = '.prev-button';
    await page.click(prevButtonSelector); // Click the previous button
    await page.waitForSelector(numberInputSelector, { timeout: 7000 });
    const returnedAnswer = await page.$eval(numberInputSelector, el => el.value);
    expect(returnedAnswer).toBe('1476'); // Expect the 4-digit number answer
    const returnedTextAnswer = await page.$eval(textInputSelector, el => el.value);
    expect(returnedTextAnswer).toBe('Qin Shi Huang');
  }, 7000);

  test('should block navigation when required fields are missing or invalid', async () => {
    const numberInputSelector = '.question-block[data-element-id="H1"] input[type="number"]';
    const textInputSelector = '.question-block[data-element-id="H2"] input[type="text"]';
    const setInputValue = async (selector, value) => {
      await page.$eval(selector, (el, nextValue) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(el, nextValue);
        } else {
          el.value = nextValue;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    };

    if (await page.$('.quiz-card')) {
      await clickQuizCardByTitle(page, 'History Challenge');
    }

    await page.waitForSelector(numberInputSelector, { timeout: 7000 });
    await page.waitForSelector(textInputSelector, { timeout: 7000 });

    await page.evaluate(() => { window.__lastAlert = null; });
    await page.click('.next-button');
    await page.waitForFunction(
      () => window.__lastAlert === 'Please fill out all required fields and correct any invalid inputs on this page.',
      { timeout: 7000 }
    );

    await setInputValue(numberInputSelector, '12'); // Invalid: regex requires 3-4 digits
    await setInputValue(textInputSelector, 'Qin Shi Huang');
    await page.evaluate(() => { window.__lastAlert = null; });
    await page.click('.next-button');
    await page.waitForFunction(
      () => window.__lastAlert === 'Please fill out all required fields and correct any invalid inputs on this page.',
      { timeout: 7000 }
    );
  }, 7000);

  test('should submit the quiz and see a success message', async () => {
    const numberSelector = '.question-block[data-element-id="H1"] input[type="number"]';
    const textSelector = '.question-block[data-element-id="H2"] input[type="text"]';
    const setInputValue = async (selector, value) => {
      await page.$eval(selector, (el, nextValue) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(el, nextValue);
        } else {
          el.value = nextValue;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    };

    if (await page.$('.quiz-card')) {
      await clickQuizCardByTitle(page, 'History Challenge');
      await page.waitForSelector(numberSelector, { timeout: 7000 });
    }

    await page.waitForSelector(numberSelector, { timeout: 7000 });
    await setInputValue(numberSelector, '476');
    await page.waitForSelector(textSelector, { timeout: 7000 });
    await setInputValue(textSelector, 'Qin Shi Huang');
    await page.click('.next-button');

    await page.waitForSelector('.question-block[data-element-id="W1"] input[type="checkbox"]', { timeout: 7000 });
    const checkboxValues = ['Germany', 'Italy', 'Japan'];
    for (const value of checkboxValues) {
      const checkboxSelector = `.question-block[data-element-id="W1"] input[type="checkbox"][value="${value}"]`;
      await page.$eval(checkboxSelector, el => {
        if (!el.checked) {
          el.click();
        }
      });
    }

    await page.waitForSelector('.question-block[data-element-id="W2"] input[type="date"]', { timeout: 7000 });
    await setInputValue('.question-block[data-element-id="W2"] input[type="date"]', '1918-11-11');

    await page.waitForSelector('.next-button', { timeout: 7000 });
    await page.click('.next-button');
    await page.waitForSelector('#submit-quiz', { timeout: 7000 });
    await Promise.all([
      page.waitForRequest(
        request => request.url().includes('script.google.com/macros') && request.method() === 'POST',
        { timeout: 7000 }
      ),
      page.click('#submit-quiz'),
    ]);
    await page.waitForFunction(() => window.__lastAlert === 'Quiz submitted successfully!', { timeout: 15000 });
    const alertMessage = await page.evaluate(() => window.__lastAlert);
    expect(alertMessage).toBe('Quiz submitted successfully!');
  }, 180000);

  test('should submit the quiz and validate the data sent to the backend', async () => {
    const numberSelector = '.question-block[data-element-id="H1"] input[type="number"]';
    const textSelector = '.question-block[data-element-id="H2"] input[type="text"]';
    const setInputValue = async (selector, value) => {
      await page.$eval(selector, (el, nextValue) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(el, nextValue);
        } else {
          el.value = nextValue;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    };

    if (await page.$('.quiz-card')) {
      await clickQuizCardByTitle(page, 'History Challenge');
      await page.waitForSelector(numberSelector, { timeout: 7000 });
    }

    await page.waitForSelector(numberSelector, { timeout: 7000 });
    await setInputValue(numberSelector, '476');
    await page.waitForSelector(textSelector, { timeout: 7000 });
    await setInputValue(textSelector, 'Qin Shi Huang');
    await page.click('.next-button');

    await page.waitForSelector('.question-block[data-element-id="W1"] input[type="checkbox"]', { timeout: 7000 });
    const checkboxValues = ['Germany', 'Italy', 'Japan'];
    for (const value of checkboxValues) {
      const checkboxSelector = `.question-block[data-element-id="W1"] input[type="checkbox"][value="${value}"]`;
      await page.$eval(checkboxSelector, el => {
        if (!el.checked) {
          el.click();
        }
      });
    }

    await page.waitForSelector('.question-block[data-element-id="W2"] input[type="date"]', { timeout: 7000 });
    await setInputValue('.question-block[data-element-id="W2"] input[type="date"]', '1918-11-11');

    await page.waitForSelector('.next-button', { timeout: 7000 });
    await page.click('.next-button');
    await page.waitForSelector('#submit-quiz', { timeout: 7000 });

    const [request] = await Promise.all([
      page.waitForRequest(
        request => request.url().includes('script.google.com/macros') && request.method() === 'POST'
      ),
      page.click('#submit-quiz'),
    ]);

    const postData = JSON.parse(request.postData());
    submissionTimestamp = postData.metadata.Timestamp;

    const expectedUserAnswers = {
      "H1": "476",
      "H2": "Qin Shi Huang",
      "W1": "Germany;Italy;Japan",
      "W2": "1918-11-11"
    };

    expect(postData.quizSheetId).toBe(HISTORY_SHEET_ID);
    expect(postData.userAnswers).toEqual(expectedUserAnswers);
  });

  const responseSheetUrl = process.env.RESPONSE_SHEET_URL;
  const responseSheetTest = responseSheetUrl ? test : test.skip;
  responseSheetTest('should fetch and validate the response sheet', async () => {
    const RESPONSE_SHEET_URL = responseSheetUrl;
    // NOTE: Ensure the response sheet is published to the web as CSV.
    // Provide the full CSV URL via RESPONSE_SHEET_URL to enable this test.

    const response = await page.evaluate(url => fetch(url).then(r => r.text()), RESPONSE_SHEET_URL);
    console.log('DEBUG: Raw CSV response from published sheet:', response);
    const responseData = Papa.parse(response, { header: true, skipEmptyLines: true }).data;
    
    // Find the first row that actually has a timestamp, as Google Sheets CSV export can be inconsistent.
    const lastRowWithTimestamp = responseData.reverse().find(row => row.Timestamp && row.Timestamp.trim() !== '');

    expect(lastRowWithTimestamp).toBeDefined();
    if (!lastRowWithTimestamp) {
        throw new Error("No row with a valid Timestamp found in the response sheet CSV.");
    }
    const lastRow = lastRowWithTimestamp; // Use this valid row for assertions

    // Loosely check if the timestamp is recent, allowing for minor time differences
    const tenMinutesAgo = new Date(new Date().getTime() - 10 * 60 * 1000).getTime(); // Convert to milliseconds
    const receivedTimestamp = new Date(lastRow.Timestamp).getTime(); // Convert to milliseconds
    expect(receivedTimestamp).toBeGreaterThan(tenMinutesAgo);

    expect(lastRow.H1).toBe('476');
    expect(lastRow.H2).toBe('Qin Shi Huang');
    expect(lastRow.W1).toBe('Germany;Italy;Japan');
    expect(lastRow.W2).toBe('1918-11-11');
  }, 180000);
  
  test('should handle a signature question and submit its data', async () => {
    await page.goto(`${BASE_URL}?sheetId=${MASTER_SHEET_ID}`);
    await page.waitForFunction(
      () => {
        const loadingMessage = document.querySelector('.loading-message');
        const errorMessage = document.querySelector('.error-message');
        const quizSelectionTitle = document.querySelector('div.quiz-selection h2');
        return (!loadingMessage && !errorMessage && quizSelectionTitle && quizSelectionTitle.textContent.length > 0);
      },
      { timeout: 7000 }
    );
    await page.waitForSelector('div.quiz-selection h2', { timeout: 7000 });
    // Removed: await clickQuizCardByTitle(page, 'My Awesome Quizzes Collection');

    // Navigate to the signature quiz by mocking the master sheet to only contain the signature quiz initially
    // For this specific test, we'll navigate directly to the signature quiz to avoid complexities of other quizzes.
    // In a more complex scenario, we'd mock the master sheet appropriately or click the correct card.
    await page.goto(`${BASE_URL}?sheetId=${SIGNATURE_SHEET_ID}`);
    await page.waitForSelector('.info-text', { timeout: 7000 });

    // Click the "Add Signature" button
    await page.click('.add-signature-button');
    await page.waitForSelector('.signature-modal-content', { timeout: 7000 });

    // Draw a simple line on the canvas
    const canvas = await page.$('.signature-canvas');
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 10, boundingBox.y + 10);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50, { steps: 5 });
      await page.mouse.up();
    }

    // Click the "Save" button in the modal
    await page.click('.save-button');
    await page.waitForSelector('.signature-modal-content', { hidden: true, timeout: 7000 });

    // Ensure the signature preview is displayed
    await page.waitForSelector('.signature-preview .signature-img-preview', { timeout: 7000 });
    const signatureSrc = await page.$eval('.signature-preview .signature-img-preview', el => el.src);
    expect(signatureSrc).toMatch(/^data:image\/png;base64,/);

    // Submit the quiz
    if (await page.$('.next-button')) {
      await page.click('.next-button');
    }
    await page.waitForSelector('#submit-quiz', { timeout: 7000 });

    const [request] = await Promise.all([
      page.waitForRequest(
        request => request.url().includes('script.google.com/macros') && request.method() === 'POST'
      ),
      page.click('#submit-quiz'),
    ]);

    const postData = JSON.parse(request.postData());
    expect(postData.quizSheetId).toBe(SIGNATURE_SHEET_ID);
    expect(postData.userAnswers.SIG1).toMatch(/^data:image\/png;base64,/);
    expect(postData.userAnswers.SIG1.length).toBeGreaterThan(100); // Check for a non-empty data URL
  }, 180000);
  
  // TODO: Add tests for other question types (number, date, time, choice, multi-choice)
  // TODO: Add tests for client-side validation
  // TODO: Add tests for quiz submission
  // TODO: Add tests for error handling
});
