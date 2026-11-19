import { test, expect } from './fixtures.js';

test('[BASELINE-001] public entry point loads @smoke @baseline', async ({ page }) => {
  // Infrastructure baseline only; never count this as GLOP-1478 acceptance coverage.
  const response = await page.goto('/');
  expect(response, 'Navigation should return an HTTP response').not.toBeNull();
  expect(response!.ok(), `Entry point returned ${response?.status()}`).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveTitle('');
});
