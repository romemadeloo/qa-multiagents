import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
export const workspaceConfig = JSON.parse(readFileSync(resolve(workspaceRoot, 'qa.config.json'), 'utf8'));

// Applications a ticket can target, and the environment variable that overrides each URL.
export const APPS = ['storefront', 'admin', 'api'];
export const APP_URL_VARS = { storefront: 'STOREFRONT_URL', admin: 'ADMIN_URL', api: 'API_URL' };

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|\.(localhost|test)$/;

export function loadEnvironment(root = workspaceRoot) {
  dotenv.config({ path: resolve(root, '.env'), quiet: true });
}

function brandForHost(hostname, config) {
  for (const [name, brand] of Object.entries(config.brands || {})) {
    if ((brand.domains || []).some(d => hostname === d || hostname.endsWith(`.${d}`))) return { name, ...brand };
  }
  return null;
}

// True for any host listed as a brand's production server.
export function isProductionHost(hostname, config = workspaceConfig) {
  const host = hostname.toLowerCase();
  return Object.values(config.brands || {}).some(b => (b.productionHosts || []).includes(host));
}

// Testing is dev-only: a URL passes only when its host matches a registered brand's
// dev pattern (or is a local development host). Production and unknown hosts are refused.
export function assertDevUrl(url, config = workspaceConfig) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Target URLs must be HTTP(S) without embedded credentials.');
  }
  const host = parsed.hostname.toLowerCase();
  if (LOCAL_HOST.test(host)) return { url: parsed.href, brand: 'local' };
  if (isProductionHost(host, config)) throw new Error(`${host} is a production server. Testing is limited to dev servers.`);
  const brand = brandForHost(host, config);
  if (!brand) {
    throw new Error(`${host} does not belong to a brand in qa.config.json. Add the brand with its domains, devHostPattern and productionHosts first.`);
  }
  if (!new RegExp(brand.devHostPattern, 'i').test(host)) {
    throw new Error(`${host} is not a ${brand.name} dev server (expected ${brand.devHostPattern}). Testing is limited to dev servers.`);
  }
  return { url: parsed.href, brand: brand.name };
}

// Validates the servers given for one ticket and returns its environment record.
export function buildEnvironment(urls, source, config = workspaceConfig) {
  const environment = {};
  const brands = new Set();
  for (const app of APPS) {
    if (!urls[app]) continue;
    const checked = assertDevUrl(urls[app], config);
    environment[app] = checked.url;
    brands.add(checked.brand);
  }
  if (!Object.keys(environment).length) throw new Error('Provide at least one server URL (--storefront, --admin or --api).');
  if (brands.size > 1) throw new Error(`Ticket servers belong to different brands: ${[...brands].join(', ')}.`);
  const first = new URL(environment.storefront || environment.admin || environment.api);
  return {
    brand: [...brands][0],
    server: first.hostname.split('.')[0],
    ...environment,
    source,
    recordedAt: new Date().toISOString()
  };
}

// Ticket folders live outside this repository (qa.config.json ticketsDir, default
// ../tickets) so the QA owner sees them next to multi-agents\. QA_TICKETS_DIR overrides it.
export function ticketsRoot(root = workspaceRoot, env = process.env, config = workspaceConfig) {
  return resolve(root, env.QA_TICKETS_DIR || config.ticketsDir || 'tickets');
}

export function ticketDir(id, root = workspaceRoot) {
  return inside(ticketsRoot(root), validateTicketId(id));
}

export function readTicketEnvironment(id, root = workspaceRoot) {
  const file = resolve(ticketDir(id, root), 'ticket.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')).environment || null;
}

// URL precedence for each app: explicit environment variable, then the ticket's
// saved servers, then the qa.config.json defaults. A ticket with saved servers never
// borrows a default for an app it did not list. Every URL must pass assertDevUrl.
export function getApps(env = process.env, config = workspaceConfig, ticketEnvironment = null) {
  const apps = {};
  for (const app of APPS) {
    const override = app === (env.APP_TARGET || config.defaultTarget) && env.BASE_URL ? env.BASE_URL : env[APP_URL_VARS[app]];
    const url = override || (ticketEnvironment ? ticketEnvironment[app] : config.targets?.[app]);
    if (url) apps[app] = assertDevUrl(url, config).url;
  }
  return apps;
}

export function getTarget(env = process.env, config = workspaceConfig, ticketEnvironment = null) {
  const name = env.APP_TARGET || config.defaultTarget;
  if (!APPS.includes(name)) throw new Error(`Unknown APP_TARGET: ${name}. Use ${APPS.join(', ')}.`);
  const baseURL = getApps(env, config, ticketEnvironment)[name];
  if (!baseURL) throw new Error(`No ${name} URL is configured. Save the ticket's ${name} server with npm run qa:env.`);
  return { name, baseURL };
}

export function validateTicketId(id) {
  if (!/^[A-Z][A-Z0-9]{1,15}-[1-9][0-9]{0,9}$/.test(id || '')) {
    throw new Error('Use an uppercase ticket ID such as GLOP-1478. Paths and spaces are not allowed.');
  }
  return id;
}

export function inside(root, ...segments) {
  const destination = resolve(root, ...segments);
  const rel = relative(resolve(root), destination);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path must stay inside the workspace.');
  return destination;
}

// Parses --storefront/--admin/--api URL flags; returns { urls, rest } with other arguments untouched.
export function parseServerFlags(args) {
  const urls = {};
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    const match = /^--(storefront|admin|api)(?:=(.*))?$/.exec(args[i]);
    if (!match) { rest.push(args[i]); continue; }
    const value = match[2] ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`--${match[1]} needs a URL.`);
    urls[match[1]] = value;
  }
  return { urls, rest };
}
