To get the frontend working, you need to create three types of Google Sheets and configure them as follows:

## 1. Content Google Sheet (for UI localization)

This sheet will store all the translatable text used in the frontend application.

**Steps to Create and Configure:**

1.  **Create a New Google Sheet:** Go to Google Sheets and create a new blank spreadsheet.
2.  **Rename the Sheet:** Rename the sheet to something like `QuizAppContent`.
3.  **Set up Columns:** In the first row, create the following column headers (case-sensitive):
    *   `Key`: A unique identifier for each piece of text (e.g., `app_title`, `header_welcome`, `submit_quiz_button`).
    *   `English`: The text in English.
    *   `Hebrew`: The text in Hebrew (or your primary RTL language).
    *   `Context/Description`: (Optional) A brief explanation or context for the text, helpful for translators.
4.  **Populate with Content:** Fill in the rows with the UI text for your application. You can refer to the `data-i18n` attributes in `frontend/index.html` as keys.
    *   Example Row:
        | Key              | English         | Hebrew      | Context/Description |
        | :--------------- | :-------------- | :---------- | :------------------ |
        | `app_title`      | Quiz Application| אפליקציית חידונים | Main application title |
        | `header_welcome` | Welcome to the Quiz App! | ברוכים הבאים לאפליקציית החידונים! | Welcome message in the header |
        | `quiz_selection_heading` | Select a Quiz | בחר חידון | Heading for the quiz selection section |
        | `submit_quiz_button` | Submit Quiz | שלח חידון | Text for the quiz submission button |
        | `error_no_sheet_id` | No quiz sheet ID provided in the URL. | מזהה גיליון חידון לא סופק ב-URL. | Error message when sheetId is missing |
        | `error_fetching_master_sheet` | Error loading quizzes. | שגיאה בטעינת חידונים. | Error message for master sheet fetch |
        | `no_quizzes_available` | No quizzes available. | אין חידונים זמינים. | Message when no quizzes are in master sheet |
        | `error_fetching_quiz` | Error loading quiz. | שגיאה בטעינת החידון. | Error message for individual quiz fetch |
        | `free_text_placeholder` | Your answer here... | תשובתך כאן... | Placeholder for free text questions |
        | `hint_label` | Hint | רמז | Label for a question hint |
        | `quiz_submit_success` | Quiz submitted successfully! | החידון נשלח בהצלחה! | Success message after quiz submission |
        | `quiz_submit_error` | Error submitting quiz: | שגיאה בשליחת החידון: | Error message for quiz submission |
        | `quiz_submit_network_error` | Network error during quiz submission. | שגיאת רשת במהלך שליחת החידון. | Network error during submission |
        | `footer_text` | © 2026 Quiz Application | © 2026 אפליקציית חידונים | Footer copyright text |

5.  **Get the Sheet ID:** The Sheet ID is found in the URL of your Google Sheet. It's the long alphanumeric string between `/d/` and `/edit`.
    *   Example URL: `https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL0MNOpqrSTUvWXYz/edit#gid=0`
    *   The `sheetId` would be: `1ABC123DEF456GHI789JKL0MNOpqrSTUvWXYz`
6.  **Update `script.js`:** Open `frontend/script.js` and replace `'YOUR_CONTENT_SHEET_ID_HERE'` with the actual Sheet ID you just copied:
    ```javascript
    const contentSheetId = 'YOUR_CONTENT_SHEET_ID_HERE'; // *** IMPORTANT: Replace with actual Content Sheet ID ***
    ```
    should become
    ```javascript
    const contentSheetId = '1ABC123DEF456GHI789JKL0MNOpqrSTUvWXYz'; // Example Sheet ID
    ```

## 2. Master Google Sheet (for Listing Quizzes)

This sheet will list all the available quizzes, each pointing to its own individual quiz sheet and a response sheet.

**Steps to Create and Configure:**

1.  **Create a New Google Sheet:** Go to Google Sheets and create a new blank spreadsheet.
2.  **Rename the Sheet:** Rename it to something like `MasterQuizList`.
3.  **Set up Columns:** In the first row, create the following column headers (case-sensitive):
    *   `Quiz Title`: The title of the quiz (e.g., `Science Basics Quiz`).
    *   `Quiz Description`: A brief description of the quiz.
    *   `GID`: The `gid` (Grid ID) of the *individual quiz sheet* within its Google Sheet (explained in section 3). This is usually `0` for the first tab, or a different number if the quiz data is on another tab.
    *   `Response Sheet ID`: The full Sheet ID of the Google Sheet where responses for *this specific quiz* should be saved.
4.  **Populate with Quiz Entries:** Add a row for each quiz you want to make available.
    *   Example Row:
        | Quiz Title         | Quiz Description             | GID | Response Sheet ID                  |
        | :----------------- | :--------------------------- | :-- | :--------------------------------- |
        | Science Basics     | Test your knowledge of basic science. | `0` | `1QAZ2WSX3EDC4RFV5TGB6YHN7UJM8IK9` |
        | History Challenge  | A challenging quiz on world history. | `123456789` | `1PLM2KOI3JNB4UHY5TGVE6RDF7CWQ8AZ` |
        *(Note: The `Response Sheet ID`s will need to be created first, as described in section 3.2)*
5.  **Get the Master Sheet ID:** Copy the full Sheet ID from the URL of this Master Quiz List sheet.
6.  **Run the Frontend with Master Sheet ID:** When you open your `index.html` file in the browser, you'll append this Sheet ID as a URL parameter:
    *   Example: `http://localhost:8000?sheetId=YOUR_MASTER_SHEET_ID_HERE`
    *   So, if your Master Sheet ID is `1MASTER123ABCDEF`, you would navigate to:
        `http://localhost:8000?sheetId=1MASTER123ABCDEF`

## 3. Individual Quiz Sheets (for Questions and Options)

Each entry in your Master Google Sheet will correspond to one of these individual quiz sheets. These sheets contain the actual questions and answer options for a quiz.

**Steps to Create and Configure:**

1.  **Create New Google Sheets (one per quiz):** For each quiz you listed in your Master Google Sheet, create a new blank spreadsheet.
2.  **Rename the Sheet (Optional):** Rename it to match the quiz title (e.g., `Science Basics Questions`).
3.  **Set up Columns:** In the first row, create the following column headers (case-sensitive):
    *   `Question Text`: The question itself.
    *   `Question Description`: (Optional) Additional context or details for the question.
    *   `Question Type`: `single` (for radio buttons), `multi` (for checkboxes), or `free-text` (for a textarea).
    *   `Option 1`, `Option 2`, `Option 3`, `Option 4`: (For `single` and `multi` type questions) The possible answer options. Leave blank if not applicable.
    *   `Hint`: (Optional) A hint for the question.
4.  **Populate with Questions:** Fill in the rows with your quiz questions.
    *   Example Row (Single Choice):
        | Question Text           | Question Description | Question Type | Option 1 | Option 2 | Option 3 | Option 4 | Hint             |
        | :---------------------- | :------------------- | :------------ | :------- | :------- | :------- | :------- | :--------------- |
        | What is the capital of France? | | single        | Paris    | London   | Berlin   | Rome     | It's a famous romantic city. |
    *   Example Row (Multi Choice):
        | Question Text           | Question Description | Question Type | Option 1 | Option 2 | Option 3 | Option 4 | Hint             |
        | :---------------------- | :------------------- | :------------ | :------- | :------- | :------- | :------- | :--------------- |
        | Which are primary colors? | Select all that apply. | multi        | Red      | Green    | Blue     | Yellow   | Think of light. |
    *   Example Row (Free Text):
        | Question Text           | Question Description | Question Type | Option 1 | Option 2 | Option 3 | Option 4 | Hint             |
        | :---------------------- | :------------------- | :------------ | :------- | :------- | :------- | :------- | :--------------- |
        | Explain photosynthesis. | In your own words.   | free-text     |          |          |          |          | It involves plants and sunlight. |
5.  **Get the GID:** If your questions are on the first tab of the sheet, the `GID` is `0`. If they are on another tab, you can find the `GID` in the URL when that tab is selected.
    *   Example URL with tab selected: `https://docs.google.com/spreadsheets/d/YOUR_QUIZ_SHEET_ID/edit#gid=123456789`
    *   The `GID` would be `123456789`.
6.  **Create a Response Sheet for each Quiz (Important):** For each individual quiz, you need a separate Google Sheet where its responses will be saved by the Google Apps Script backend.
    *   Create a new Google Sheet (e.g., `Science Basics Responses`).
    *   The columns of this sheet will be populated by the Google Apps Script when quiz submissions are received. It's recommended to have at least `Timestamp`, `User-Agent`, `Latitude`, `Longitude`, `Location Status`, `Quiz Sheet ID`, and then columns for each of your questions (e.g., `Question 1 Answer`, `Question 2 Answer`).
    *   Get the full Sheet ID of this Response Sheet. This is the ID you will put in the `Response Sheet ID` column of your **Master Google Sheet** for the corresponding quiz.

After setting up all these sheets and updating `contentSheetId` in `script.js`, you should be able to run the frontend, pass the Master Sheet ID in the URL, and see your quizzes.