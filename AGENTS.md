# Repository Guidelines

## Project Structure & Module Organization
- `backend_gas/`: Google Apps Script backend (entry in `Code.js`, config in `appsscript.json`).
- `frontend/`: React (CRA) frontend. UI in `src/components/`, data/services in `src/services/`, context in `src/context/`, tests in `src/*.test.js` and `src/e2e-tests/`.
- `quiz_data/`: CSV examples for master/quiz/response sheets used by the app.
- `form_copy/` and root `.md` files: reference docs and legacy copies (use for guidance, not runtime).

## Build, Test, and Development Commands
- `cd frontend && npm install`: install frontend dependencies.
- `cd frontend && npm start`: run the UI at `http://localhost:3000`.
- `cd frontend && npm test`: unit tests (Jest + Testing Library).
- `cd frontend && npm run test:e2e`: E2E tests with Puppeteer; requires a running dev server and valid Sheets data.
- `cd frontend && npm run build`: production build in `frontend/build`.
- `clasp push` / `clasp deploy`: sync and deploy Apps Script (`backend_gas/`; see `user_gas_instructions.md`).
- `./test_script.sh` or `./test_script_dev.sh`: curl smoke tests against deployed GAS endpoints.

## Coding Style & Naming Conventions
- JavaScript/React with semicolons; prefer `const` and `let`.
- Match existing formatting: frontend files use 4-space indentation; Apps Script uses 2-space indentation.
- React components and files use PascalCase (e.g., `QuizSelection.js`); functions/variables use camelCase.

## Testing Guidelines
- Unit tests live alongside source (`frontend/src/*.test.js`).
- E2E tests live in `frontend/src/e2e-tests/` and are run via `npm run test:e2e`.
- Keep tests deterministic; avoid hard-coded Sheet IDs unless the test is explicitly tied to staging data.

## Commit & Pull Request Guidelines
- Commit messages follow a Conventional Commits style (`feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`), optionally with a scope (e.g., `feat(frontend): ...`).
- PRs should include: a short summary, testing notes (commands run), and screenshots for UI changes when applicable.

## Configuration & External Services
- The app reads quiz data from Google Sheets CSV exports; master sheet IDs are passed via `?sheetId=...`.
- Set `REACT_APP_GAS_WEB_APP_URL` in a `.env` file for frontend submissions (see `frontend/src/services/gasWebApp.js`).
