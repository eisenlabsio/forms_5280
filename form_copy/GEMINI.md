# Project Overview

This directory contains a Google Apps Script (`script.js`) designed to generate a printable, blank summary document from a Google Form. The script reads a specified Google Form, creates a new Google Document, and then populates this document with the form's questions and answer options, formatting it for easy printing and manual completion.

The primary purpose of this script is to provide a way to fill out a Google Form in an offline or paper-based format.

## Key Technologies

*   **Google Apps Script:** The entire project is written in Google Apps Script, which is a JavaScript-based language for automating tasks across Google products.
*   **Google Forms API (`FormApp`):** Used to read the structure and content of Google Forms.
*   **Google Docs API (`DocumentApp`):** Used to create and format the summary documents.
*   **Google Drive API (`DriveApp`):** Used for file management (moving the created document to the correct folder).

## How to Run the Script

To run this script, you need to open it in the Google Apps Script editor. You can then run the `runFormSummaryGenerator` function.

1.  **Open the Script:** Open the `script.js` file in your Google Apps Script editor.
2.  **Select the Function:** In the editor's toolbar, select `runFormSummaryGenerator` from the function dropdown list.
3.  **Run:** Click the "Run" button (looks like a play icon).

The script will then create a new Google Document in the folder specified by the `TARGET_DIRECTORY` constant.

## Development Conventions

*   **Constants for IDs:** The script uses constants (`FORMS`, `TARGET_DIRECTORY`) to store the IDs of the Google Forms and the target Google Drive folder. This makes it easy to update these values without changing the core logic of the script.
*   **Right-to-Left (RTL) Language Support:** The script includes logic to set the text direction of the document to right-to-left, which is necessary for languages like Hebrew.
*   **Error Handling:** The `runFormSummaryGenerator` function includes a `try...catch` block to log any errors that occur during the document creation process.
