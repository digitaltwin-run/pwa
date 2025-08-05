// playwright.config.js - Enhanced for HMI Pattern Testing
const { devices } = require('@playwright/test');

module.exports = {
  testDir: './e2e',
  timeout: 60000, // Increased for complex HMI patterns
  fullyParallel: false, // HMI tests may interfere with each other
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker for consistent HMI testing
  reporter: [['html'], ['json', { outputFile: 'test-results/hmi-results.json' }]],
  use: {
    baseURL: 'http://localhost:5005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // HMI-specific settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'hmi-pattern-testing',
      testMatch: '**/playwright-hmi-patterns.spec.js',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }
  ],
  webServer: {
    command: 'cd .. && python -m http.server 5005',
    port: 5005,
    reuseExistingServer: !process.env.CI,
  },
};
