# Project Definition: Quiz Site from Google Sheet

## Objective
To create a simple, static HTML website that allows users to select and take quizzes. The available quizzes will be listed in a "master" Google Spreadsheet, and each individual quiz's questions and answers will reside on separate tabs (sheets) within the same Google Spreadsheet.

## Core Features:

1.  **Spreadsheet ID Parameter**: The site will accept a Google Spreadsheet ID via a URL query parameter (e.g., `?sheetId=YOUR_MASTER_SHEET_ID`). This `sheetId` will point to the *master sheet*.
2.  **Fetch Master Sheet Content**: The site will use JavaScript to fetch data from the specified public Google Spreadsheet (the master sheet).
3.  **Display Quiz Selection**: The master sheet content will be parsed to present a list of available quizzes to the user (e.g., by title and description).
4.  **User Selects Quiz**: Upon selection, the site will fetch the content of the specific quiz sheet using its associated `gid`.
5.  **Display Individual Quizzes**: The fetched quiz data will be parsed and rendered as an interactive quiz on the webpage.
6.  **Quiz Interaction**: Users can answer questions, submit their answers, and receive a score/feedback.
7.  **Metadata Collection**: Automatically collect user's IP address, browser information, approximate geographical location, and submission timestamp on quiz submission.
8.  **Dynamic Content**: All user-facing text (titles, labels, messages) will be loaded dynamically from a dedicated Content Google Sheet to support localization and easy updates.

## Design and Localization Requirements:

*   **Language Support**: Full support for Hebrew, including Right-to-Left (RTL) text direction.
*   **Responsiveness**: The site must be fully responsive and provide an optimal user experience on both mobile devices and desktop computers.
*   **Aesthetics**: The design should be modern, visually appealing, and compatible with current web standards (circa 2026).

## Data Structure:

### Master Google Sheet (identified by `sheetId` parameter):
This sheet will list all available quizzes.
*   **Column A**: Quiz Title (e.g., "History Quiz", "Science Basics")
*   **Column B**: Quiz Description (e.g., "Test your knowledge of ancient history.", "Fundamental science concepts.")
*   **Column C**: GID (Sheet ID of the actual quiz tab) - (e.g., "0", "123456789")
*   **Column D**: Response Sheet ID (Optional, the ID of a *separate* Google Sheet where user responses for this quiz should be recorded. This is used for submitting answers.)

### Content Google Sheet (dedicated for all UI texts, labels, messages):
This sheet will store all static texts for the website, enabling easy localization and updates.
*   **Column A**: `Key` (Unique identifier for each text string, e.g., `header_title`, `quiz_selection_heading`, `submit_button_label`).
*   **Column B**: `English` (The text string in English).
*   **Column C**: `Hebrew` (The text string in Hebrew for RTL display).
*   **Column D**: `Context/Description` (Optional: Explanation of text usage).

### Individual Quiz Sheets (identified by `gid` from the master sheet):
Each of these sheets will contain the questions for a specific quiz.
*   **Column A**: Question Text (e.g., "What is the capital of France?")
*   **Column B**: Question Type (e.g., "single", "multi", "free-text")
*   **Column C**: Question Description (Optional, e.g., "Choose one option below.")
*   **Column D**: Option 1 (For "single" or "multi" type questions)
*   **Column E**: Option 2 (For "single" or "multi" type questions)
*   **Column F**: Option 3 (For "single" or "multi" type questions)
*   **Column G**: Option 4 (For "single" or "multi" type questions)
*   **Column H**: Correct Answer(s) (For "single" type, e.g., "Paris"; for "multi" type, a comma-separated list, e.g., "Option A,Option C"; for "free-text", the exact expected answer)
*   **Column I**: Regex Validation (Optional, for "free-text" questions, a regex pattern to validate the answer)
*   **Column J**: Hint (Optional, a helpful tip for the user)
*   **Column K**: Minimum Score to Pass (e.g., "70" for 70%)
*   **Column L**: Section/Page Name (Optional, for grouping questions into logical sections or pages)

## Technical Considerations:

*   **HTML**: Basic structure for quiz selection and quiz interface, designed to be content-agnostic and populated by JavaScript.
*   **CSS**: Styling for readability and user experience, with specific considerations for RTL text direction.
*   **Deployment (Frontend)**: The frontend will be deployed using GitHub Pages, served directly from the root of the `main` branch.
*   **Client-Side JavaScript (`script.js`)**:
    *   Reading URL parameters.
    *   **Fetching content from the Content Google Sheet to populate UI elements.**
    *   Making API calls to Google Sheets for quiz data (using the `export?format=csv&gid=` URL).
    *   Parsing the master sheet data to create a quiz selection list.
    *   Handling user selection of a quiz.
    *   Fetching and parsing individual quiz sheet data.
    *   Dynamically generating and displaying quiz elements.
    *   Handling user interaction (selecting answers, checking results).
    *   Collecting browser information (User-Agent string), current timestamp.
    *   Attempting to collect approximate geographical location using `navigator.geolocation.getCurrentPosition()`, with robust error handling for user permission denial, unavailability, or timeout.
    *   Packaging all collected quiz answers and metadata (browser info, timestamp, geolocation data) into a JSON payload.
    *   Submitting this JSON payload via a `POST` request to the deployed Google Apps Script (GAS) Web App.
*   **Server-Side Google Apps Script (GAS) Web App**:
    *   Acts as a backend proxy to securely receive quiz submissions from the frontend.
    *   `doPost(e)` function will receive JSON data containing quiz answers, originating quiz's `sheetId`, and collected client-side metadata.
    *   Parses the incoming data, extracts quiz answers and all client-side metadata.
    *   Extracts the client's IP address from the GAS request event object (`e.remoteAddress` or similar property).
    *   Identifies the target "Response Sheet ID" from the Master Google Sheet based on the quiz's `sheetId`.
    *   Appends a new row to the identified Response Sheet containing the quiz answers and all metadata (IP address, browser info, timestamp, geolocation data).
    *   Returns a JSON response to the frontend client indicating the success or failure of the submission.

## Next Steps:

1.  **Develop Client-Side `script.js`**: Implement logic for fetching, parsing, displaying, and rendering quizzes. **Include logic to fetch and apply content from the Content Google Sheet.** Update submission logic to collect metadata (timestamp, browser info, and geolocation) and send data to the GAS Web App.
2.  **Develop Server-Side GAS Web App**: Implement the Google Apps Script with the `doPost` function for receiving, parsing, and saving quiz responses along with user metadata (including IP address extracted server-side, timestamp, browser info, and geolocation).
3.  **Detailed Design**: Define the exact HTML structure and CSS rules, *ensuring support for RTL and responsive design*.
4.  **Implementation**: Build out the HTML, CSS, and remaining JavaScript.
5.  **Testing**: Ensure the site correctly fetches, displays, scores quizzes, and submits responses via the GAS Web App, including all metadata, and verify RTL and responsiveness.