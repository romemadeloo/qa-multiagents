import { defineConfig, devices } from '@playwright/test';
import { sharedConfig } from './playwright.shared.js';

const shared = sharedConfig(true);

export default defineConfig({
  ...shared,
  testDir: './demo/tests',
  metadata: { purpose: 'Local harness validation only. No Musticker ticket coverage.' },
  use: { ...shared.use, baseURL: 'http://127.0.0.1:4179' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node demo/server.mjs',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 15_000
  }
});
