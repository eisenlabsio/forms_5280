# Project Overview

This project is a quiz website that dynamically loads quizzes from a Google Sheet. The frontend is a static HTML/CSS/JS application that fetches quiz data from public Google Sheets. The backend is a Google Apps Script web app that receives quiz submissions and saves them to a separate Google Sheet.

There is also a `form_copy` directory that contains a script to generate a printable, blank summary document from a Google Form. This appears to be a separate utility and not directly part of the main quiz application.

## Key Technologies

*   **Frontend:** HTML, CSS, JavaScript
*   **Backend:** Google Apps Script
*   **Data Source:** Google Sheets

## How to Run

### Frontend

1.  Open `frontend/index.html` in a web browser.
2.  The quiz selection and content are loaded dynamically from Google Sheets, specified by a `sheetId` in the URL.

### Backend (Google Apps Script)

The backend is a Google Apps Script web app. To deploy and run it, follow these steps:

1.  **Install `clasp`:**
    ```bash
    npm install -g @google/clasp
    ```
2.  **Login to `clasp`:**
    ```bash
    clasp login
    ```
3.  **Navigate to the backend directory:**
    ```bash
    cd backend_gas
    ```
4.  **Create and link the GAS project:**
    ```bash
    clasp create --type webapp --title "QuizAppBackend" --rootDir .
    ```
5.  **Deploy the web app:**
    ```bash
    clasp deploy
    ```
6.  **Get the web app URL:**
    ```bash
    clasp deployments
    ```
7.  **Update the frontend:** The `gasWebAppLink` constant in `frontend/script.js` needs to be updated with the deployed web app URL.

## Development Conventions

*   **Quiz Definitions:** Quizzes are defined in Google Sheets. A master sheet lists all available quizzes, and individual sheets contain the questions for each quiz.
*   **Dynamic Content:** All user-facing text is loaded from a dedicated Google Sheet to support localization and easy updates.
*   **Backend Submissions:** The frontend submits quiz answers to the Google Apps Script backend, which then appends the results to a response sheet.
*   **`form_copy` script:** The `form_copy` script is a separate utility for creating a printable summary of a Google Form. It is not part of the main quiz application. To run it, open the `script.js` file in the Google Apps Script editor and run the `runFormSummaryGenerator` function.
