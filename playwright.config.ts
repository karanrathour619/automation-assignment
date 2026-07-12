import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────────────────
  testDir: './tests',
  fullyParallel: false,   // API tests are serial; UI tests may share session
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,             // Keep at 1 for AA CE to avoid session conflicts

  // ── Reporting ───────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // ── Global test settings ────────────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'https://community.cloud.automationanywhere.digital',
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,

    // Evidence artifacts — captured automatically on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Generous timeouts for AA CE which can be slow
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },

  // ── Global timeout ───────────────────────────────────────────────────────────
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },

  // ── Projects (browsers) ─────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ── Output ──────────────────────────────────────────────────────────────────
  outputDir: 'test-results/',
});
