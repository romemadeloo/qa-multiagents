import { defineConfig } from '@playwright/test';
import { sharedConfig } from './playwright.shared.js';
import { getApps, getTarget, readTicketEnvironment } from './scripts/runtime.mjs';

// qa:run sets QA_TICKET so every app URL comes from that ticket's saved dev servers.
const ticketEnvironment = process.env.QA_TICKET ? readTicketEnvironment(process.env.QA_TICKET) : null;
const target = getTarget(process.env, undefined, ticketEnvironment);
const apps = getApps(process.env, undefined, ticketEnvironment);
const shared = sharedConfig();

export default defineConfig({
  ...shared,
  testDir: './tests/e2e',
  metadata: {
    target: target.name, baseURL: target.baseURL, apps,
    brand: ticketEnvironment?.brand || 'unrecorded', server: ticketEnvironment?.server || 'unrecorded',
    build: process.env.APP_BUILD || 'unconfirmed'
  },
  use: { ...shared.use, baseURL: target.baseURL }
});
