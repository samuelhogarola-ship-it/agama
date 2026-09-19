import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: /client-catalog-stores\.spec\.js$/,
  timeout: 30000, workers: 2,
  use: { baseURL: 'http://127.0.0.1:3460', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'python3 -m http.server 3460 --bind 127.0.0.1 --directory dist', url: 'http://127.0.0.1:3460', reuseExistingServer: true, stderr: 'ignore' },
});
