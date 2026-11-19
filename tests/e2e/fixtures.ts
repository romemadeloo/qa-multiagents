import { test as base, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { getApps, isProductionHost, readTicketEnvironment } from '../../scripts/runtime.mjs';

// Import `test` and `expect` from this file in every spec, never from '@playwright/test'.
// It guards each browser context against production and exposes the ticket's dev servers.

type Apps = { storefront?: string; admin?: string; api?: string };

const ticketEnvironment = process.env.QA_TICKET ? readTicketEnvironment(process.env.QA_TICKET) : null;
const apps: Apps = getApps(process.env, undefined, ticketEnvironment);

// Navigations, API calls and writes to a production host are aborted and fail the test.
// Static GETs (images, scripts, styles, fonts) a dev page pulls from production are
// aborted too but only annotated, because they test nothing on production.
async function guardProduction(context: BrowserContext, violations: string[], notes: string[]) {
  await context.route(url => isProductionHost(url.hostname), async route => {
    const request = route.request();
    const entry = `${request.method()} ${request.url()}`;
    const passive = ['GET', 'HEAD'].includes(request.method()) && ['image', 'script', 'stylesheet', 'font', 'media'].includes(request.resourceType());
    (passive ? notes : violations).push(entry);
    await route.abort('blockedbyclient');
  });
}

export const test = base.extend<{ apps: Apps; productionGuard: void; adminPage: Page; api: APIRequestContext }>({
  apps: async ({}, use) => { await use(apps); },

  productionGuard: [async ({ context }, use, testInfo) => {
    const violations: string[] = [];
    const notes: string[] = [];
    await guardProduction(context, violations, notes);
    await use();
    for (const entry of notes) testInfo.annotations.push({ type: 'production-asset-blocked', description: entry });
    expect(violations, 'Requests to production were blocked; tests must stay on dev servers').toEqual([]);
  }, { auto: true }],

  // A separate signed-out context on the ticket's admin server.
  adminPage: async ({ browser }, use, testInfo) => {
    test.skip(!apps.admin, 'This ticket has no admin server saved.');
    const context = await browser.newContext({ baseURL: apps.admin });
    const violations: string[] = [];
    const notes: string[] = [];
    await guardProduction(context, violations, notes);
    await use(await context.newPage());
    await context.close();
    for (const entry of notes) testInfo.annotations.push({ type: 'production-asset-blocked', description: entry });
    expect(violations, 'Admin requests to production were blocked; tests must stay on dev servers').toEqual([]);
  },

  // API calls against the ticket's API server. Relative paths resolve against that URL.
  api: async ({ playwright }, use) => {
    test.skip(!apps.api, 'This ticket has no API server saved.');
    const context = await playwright.request.newContext({ baseURL: apps.api });
    await use(context);
    await context.dispose();
  }
});

export { expect };
