import { defineConfig, devices } from '@playwright/test';

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests',
  testMatch: /portal-smoke\.spec\.js$/,
  timeout: 30000,
  outputDir: 'test-results/portal',
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/portal' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3012',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command:
          'PORTAL_PRODUCTS_SOURCE=manifest npm --prefix portal run dev -- --webpack --hostname 127.0.0.1 --port 3012',
        url: 'http://127.0.0.1:3012',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
