import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { loadEnvironment } from './scripts/runtime.mjs';

loadEnvironment();

export function sharedConfig(demo = false) {
  const directory = demo ? resolve('artifacts/demo') : resolve(process.env.QA_RUN_DIR || 'artifacts/latest');
  return defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 30_000,
    expect: { timeout: 5_000 },
    outputDir: resolve(directory, 'test-results'),
    reporter: [
      ['list'],
      ['html', { outputFolder: resolve(directory, 'html'), open: 'never' }],
      ['json', { outputFile: resolve(directory, 'results.json') }],
      ['junit', { outputFile: resolve(directory, 'junit.xml') }]
    ],
    use: {
      actionTimeout: 10_000,
      navigationTimeout: 30_000,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure'
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } }
    ]
  });
}
