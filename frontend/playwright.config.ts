import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start',
      cwd: path.resolve(here, '../backend'),
      env: { DATABASE_URL: 'file:./e2e.db', JWT_SECRET: 'local-e2e-testing-secret-do-not-use-in-production', PORT: '4000', CORS_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test' },
      url: 'http://127.0.0.1:4000/api/auth/me',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    { command: 'npm run dev', cwd: here, url: 'http://127.0.0.1:5173/login', reuseExistingServer: false, timeout: 60_000 },
  ],
});
