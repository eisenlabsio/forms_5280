// frontend/jest-e2e.config.js
module.exports = {
  // Use the custom Puppeteer environment
  testEnvironment: './src/e2e-tests/e2e-environment.js',
  // Look for test files in the 'src/e2e-tests' directory
  testMatch: [
    "<rootDir>/src/e2e-tests/**/*.test.js"
  ],
  // Optional: Set a longer timeout for E2E tests
  testTimeout: 10000,
};