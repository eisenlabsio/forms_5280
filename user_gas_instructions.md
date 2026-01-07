To proceed with the Google Apps Script (GAS) Web App development, you will be using `clasp` for local development and deployment.

**Instructions for `clasp` setup and deployment:**

1.  **Install `clasp`**: If you haven't already, install the `clasp` command-line tool globally using npm:
    ```bash
    npm install -g @google/clasp
    ```
2.  **Login to `clasp`**: Authenticate `clasp` with your Google account:
    ```bash
    clasp login
    ```
    This will open a browser window for you to log in and grant permissions.
3.  **Create a subdirectory for GAS project and link it with `clasp`**:
    First, navigate to the root of your project:
    ```bash
    cd /Users/ieisenman/workspace/gas/quizzes/
    ```
    Then, create a new directory for your GAS project:
    ```bash
    mkdir backend_gas
    cd backend_gas
    ```
    Now, create the GAS project and link it to this new directory:
    ```bash
    clasp create --type webapp --title "QuizAppBackend" --rootDir .
    ```
    This will create an `appsscript.json` and `.clasp.json` file in your `backend_gas` directory.

4.  **Copy the script content**: I will provide the script content for `Code.gs` in the next step. Create a file named `Code.gs` inside your `backend_gas` directory and paste the content there.

5.  **Configure `appsscript.json`**: Ensure the `appsscript.json` file in your `backend_gas` directory contains the necessary OAuth scopes. It should look something like this (you might need to add the `oauthScopes` array):
    ```json
    {
      "timeZone": "America/New_York",
      "dependencies": {},
      "exceptionLogging": "STACKDRIVER",
      "runtimeVersion": "V8",
      "oauthScopes": [
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/spreadsheets"
      ]
    }
    ```
    The `script.external_request` scope is needed if the GAS app makes calls to external services. The `spreadsheets` scope is essential for reading and writing to Google Sheets.

6.  **Deploy the Web App**: From inside your `backend_gas` directory, deploy your project:
    ```bash
    clasp deploy
    ```
    This will deploy a new version of your Web App.
    *   **Deployment Settings**: `clasp deploy` will use default settings for "Execute as" (usually "Me") and "Who has access" (usually "Anyone"). If you need to change these, you can do so in the Google Apps Script editor interface for the specific deployment. For this project, "Execute as: Me" and "Who has access: Anyone" is generally suitable.

7.  **Get the Web App URL**: After deployment, list your deployments to get the Web App URL:
    ```bash
    clasp deployments
    ```
    Look for the "Web app URL" in the output. **Copy this URL**.

8.  **Update `script.js`**: Once you have the Web App URL, please provide it to me. I will then update the `gasWebAppLink` constant in your frontend `script.js` file (located at `frontend/script.js`).

Once you have completed these steps and provided the Web App URL, I will mark todo item #19 as `completed` and proceed with implementing the `doPost(e)` function in the GAS script.