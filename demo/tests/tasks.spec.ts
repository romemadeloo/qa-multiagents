import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('demo adds a task using accessible controls', async ({ page }) => {
  await page.getByLabel('Task name').fill('Review acceptance criteria');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveText('Review acceptance criteria');
  await expect(page.getByRole('status')).toHaveText('Task added');
  await expect(page.getByLabel('Task name')).toHaveValue('');
});

test('demo completes a task', async ({ page }) => {
  await page.getByLabel('Task name').fill('Run smoke tests');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByRole('checkbox', { name: 'Complete Run smoke tests' }).check();
  await expect(page.getByRole('checkbox', { name: 'Complete Run smoke tests' })).toBeChecked();
});

test('demo rejects a task containing only spaces', async ({ page }) => {
  await page.getByLabel('Task name').fill('   ');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('status')).toHaveText('Enter a task name');
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('demo renders user content as text', async ({ page }) => {
  await page.getByLabel('Task name').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('listitem')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('ul img')).toHaveCount(0);
});
