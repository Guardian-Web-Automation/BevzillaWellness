import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// `||` (not `??`) so an EMPTY BASE_URL — e.g. an unset `${{ vars.BASE_URL }}` in CI,
// which expands to '' — also falls back to the default. With `??`, '' would win and
// leave baseURL empty, making every relative goto() an "invalid URL".
const BASE_URL = process.env.BASE_URL || 'https://bevzillawellness.com';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  // 15s gives network-dependent assertions (e.g. live instant-search results under
  // parallel load) headroom without masking genuine failures.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 local retry absorbs transient live-site slowness (e.g. WebKit instant-search
  // under parallel load). Deterministic failures still fail every attempt, so real
  // defects are never masked.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: process.env.CI ? 'never' : 'on-failure' }],
    ...(process.env.CI ? [['junit', { outputFile: 'results/junit.xml' }] as const] : []),
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Three projects = the sheet's 3 execution environments.
  // (Desktop/WebKit is intentionally excluded — not in the test matrix.)
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 14'] } },
  ],
});
