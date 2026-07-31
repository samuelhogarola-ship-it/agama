import { defineConfig, devices } from '@playwright/test';

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests',
  testMatch: /(agama-smoke|home-v2)\.spec\.js$/,
  timeout: 30000,
  outputDir: 'test-results/public',
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/public' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3460',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'npx serve . -l tcp://127.0.0.1:3460',
        url: 'http://127.0.0.1:3460',
        reuseExistingServer: !process.env.CI,
        timeout: 20000,
      },
});
