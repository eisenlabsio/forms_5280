const NodeEnvironment = require('jest-environment-jsdom');
const puppeteer = require('puppeteer');

class CustomPuppeteerEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();
    // Get E2E mode from environment variable
    this.global.e2eMode = process.env.E2E_MODE || 'local';

    // Launch a new browser instance
    this.global.browser = await puppeteer.launch({ headless: true });

    // Expose the browser to all tests
    // Individual tests will create their own page instances
  }

  async teardown() {
    await this.global.browser.close();
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomPuppeteerEnvironment;