# Backend (Google Apps Script) To-Do List

This list contains the remaining tasks for the Google Apps Script (GAS) Web App development.

1.  [pending] Create Google Apps Script project (using clasp in backend_gas directory).
2.  [pending] Implement `doPost(e)` function in GAS to:
    *   [pending] Receive JSON payload from frontend (including quiz answers and browser info, location, timestamp).
    *   [pending] Securely parse JSON data using `JSON.parse()` and `e.postData.contents`, handling potential parsing errors.
    *   [pending] Implement robust input validation and sanitization for all received data.
    *   [pending] Extract quiz sheet ID, user answers, and metadata.
    *   [pending] Extract client IP address from the request (`e.remoteAddress` or similar property) and add to metadata.
    *   [pending] Fetch Response Sheet ID from the Master Google Sheet using the quiz sheet ID.
    *   [pending] Append user answers and enriched metadata as a new row to the identified Response Sheet, ensuring correct column mapping.
    *   [pending] Implement comprehensive error handling and logging (e.g., using `Logger.log()` or Stackdriver Logging).
    *   [pending] Return a JSON response to the frontend client indicating success or failure, including appropriate HTTP status codes.
    *   [pending] Consider deployment settings ("Execute as", "Who has access") and define appropriate OAuth scopes in `appsscript.json` (principle of least privilege).
    *   [pending] Address CORS and Redirects considerations during client-side `POST` requests if issues arise.
