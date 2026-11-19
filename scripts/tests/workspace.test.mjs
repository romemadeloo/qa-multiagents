import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createTicket } from '../new-ticket.mjs';
import { assertDevUrl, getApps, getTarget, inside, parseServerFlags, ticketsRoot, validateTicketId, workspaceRoot } from '../runtime.mjs';
import { parseRunArguments, resolveTicketServers } from '../run-ticket.mjs';
import { setTicketEnvironment } from '../ticket-env.mjs';

const DEV = {
  storefront: 'https://dev-static-12.musticker.com/',
  admin: 'https://dev-static-12-admin-panel.musticker.com/',
  api: 'https://dev-static-12-api.musticker.com/index.php'
};

// The temp folder mirrors qa-workspace\: multi-agents\ beside tickets\.
async function withTempWorkspace(run) {
  const base = await mkdtemp(resolve(tmpdir(), 'qa-workspace-check-'));
  const root = resolve(base, 'multi-agents');
  try {
    await cp(resolve(workspaceRoot, 'templates'), resolve(root, 'templates'), { recursive: true });
    await run(root);
  } finally {
    // base was created by mkdtemp with this fixed task-specific prefix.
    assert.ok(base.startsWith(resolve(tmpdir(), 'qa-workspace-check-')));
    await rm(base, { recursive: true, force: true });
  }
}

test('ticket creation renders templates and never overwrites existing evidence', async () => {
  await withTempWorkspace(async root => {
    const directory = await createTicket(root, 'GLOP-9999', 'Synthetic ticket');
    assert.equal(directory, resolve(root, '..', 'tickets', 'GLOP-9999'));
    const intake = await readFile(resolve(directory, '00-intake.md'), 'utf8');
    assert.match(intake, /GLOP-9999/);
    assert.match(intake, /Synthetic ticket/);
    assert.doesNotMatch(intake, /\{\{/);
    const metadata = JSON.parse(await readFile(resolve(directory, 'ticket.json'), 'utf8'));
    assert.equal(metadata.status, 'needs_requirements');
    assert.equal(metadata.phases.execution, 'pending');
    assert.equal(metadata.releaseDecision, 'not_assessed');
    await assert.rejects(createTicket(root, 'GLOP-9999', 'Overwrite'), { code: 'EEXIST' });
    assert.equal(await readFile(resolve(directory, '00-intake.md'), 'utf8'), intake);
  });
});

test('tickets live beside multi-agents, overridable with QA_TICKETS_DIR', () => {
  assert.equal(ticketsRoot(workspaceRoot, {}), resolve(workspaceRoot, '..', 'tickets'));
  assert.equal(ticketsRoot(workspaceRoot, { QA_TICKETS_DIR: 'D:/qa/tickets' }), resolve('D:/qa/tickets'));
});

test('ticket IDs reject traversal and ambiguous names', () => {
  for (const id of ['../GLOP-1', 'GLOP-1/../../', 'glop-1', 'GLOP 1', 'GLOP-0', '', undefined]) {
    assert.throws(() => validateTicketId(id));
  }
  assert.equal(validateTicketId('GLOP-1478'), 'GLOP-1478');
  assert.throws(() => inside(workspaceRoot, '..', 'outside'));
});

test('target selection uses explicit overrides and rejects invalid targets or URLs', () => {
  assert.match(getTarget({ APP_TARGET: 'admin' }).baseURL, /admin-panel/);
  assert.match(getTarget({}).baseURL, /dev-static-9\.musticker/);
  assert.equal(getTarget({ APP_TARGET: 'admin', BASE_URL: 'http://localhost:8000' }).baseURL, 'http://localhost:8000/');
  assert.throws(() => getTarget({ APP_TARGET: 'production' }));
  assert.throws(() => getTarget({ BASE_URL: 'file:///tmp/data' }));
  assert.throws(() => getTarget({ BASE_URL: 'https://secret:password@example.test/' }));
});

test('only registered dev servers pass; production and unknown hosts are refused', () => {
  assert.equal(assertDevUrl(DEV.storefront).brand, 'musticker');
  assert.equal(assertDevUrl(DEV.api).url, DEV.api);
  assert.equal(assertDevUrl('http://127.0.0.1:4179/').brand, 'local');
  for (const url of ['https://www.musticker.com/kr', 'https://musticker.com/', 'https://api.musticker.com/index.php',
    'https://admin-panel.musticker.com/', 'https://staging.musticker.com/', 'https://dev-static-1.example.com/']) {
    assert.throws(() => assertDevUrl(url), url);
  }
  assert.throws(() => getTarget({ BASE_URL: 'https://www.musticker.com/kr' }), /production/);
});

test('ticket servers take precedence and never borrow qa.config.json defaults', () => {
  const ticket = { brand: 'musticker', server: 'dev-static-12', storefront: DEV.storefront };
  assert.deepEqual(getApps({}, undefined, ticket), { storefront: DEV.storefront });
  assert.equal(getTarget({}, undefined, ticket).baseURL, DEV.storefront);
  assert.throws(() => getTarget({ APP_TARGET: 'admin' }, undefined, ticket), /No admin URL/);
  assert.throws(() => resolveTicketServers({ BASE_URL: 'https://dev-static-3.musticker.com/' }, ticket), /differs from the ticket/);
  assert.equal(resolveTicketServers({ BASE_URL: DEV.storefront }, ticket).target.baseURL, DEV.storefront);
  assert.deepEqual(parseServerFlags(['Title', 'words', '--storefront', DEV.storefront, `--api=${DEV.api}`]),
    { urls: { storefront: DEV.storefront, api: DEV.api }, rest: ['Title', 'words'] });
});

test('servers given at ticket start are saved, and changes keep history', async () => {
  await withTempWorkspace(async root => {
    const directory = await createTicket(root, 'GLOP-9998', 'Servers', DEV);
    let metadata = JSON.parse(await readFile(resolve(directory, 'ticket.json'), 'utf8'));
    assert.equal(metadata.environment.brand, 'musticker');
    assert.equal(metadata.environment.server, 'dev-static-12');
    assert.equal(metadata.environment.api, DEV.api);
    await setTicketEnvironment(root, 'GLOP-9998', { storefront: 'https://dev-static-3.musticker.com/' });
    metadata = JSON.parse(await readFile(resolve(directory, 'ticket.json'), 'utf8'));
    assert.equal(metadata.environment.server, 'dev-static-3');
    assert.equal(metadata.environment.admin, undefined);
    assert.equal(metadata.environmentHistory[0].server, 'dev-static-12');
    await assert.rejects(setTicketEnvironment(root, 'GLOP-9998', { storefront: 'https://www.musticker.com/' }), /production/);
    await assert.rejects(createTicket(root, 'GLOP-9997', 'Prod', { admin: 'https://admin-panel.musticker.com/' }), /production/);
    assert.equal(existsSync(resolve(root, '..', 'tickets', 'GLOP-9997')), false);
  });
});

test('specs import test from the production-guard fixtures', async () => {
  const specs = (await readdir(resolve(workspaceRoot, 'tests', 'e2e'), { recursive: true })).filter(f => f.endsWith('.spec.ts'));
  assert.ok(specs.length > 0);
  for (const spec of specs) {
    const source = await readFile(resolve(workspaceRoot, 'tests', 'e2e', spec), 'utf8');
    assert.doesNotMatch(source, /import\s*\{[^}]*(?<![\w.])test\b[^}]*\}\s*from\s*'@playwright\/test'/, `${spec} must import test from fixtures`);
    assert.match(source, /from '(\.\/|\.\.\/)+fixtures\.js'/, `${spec} must import test from fixtures`);
  }
});

test('evidence runs retain case filters and require valid build arguments', () => {
  assert.deepEqual(parseRunArguments(['GLOP-1478', '--build', 'build-42', '--project=chromium', '--grep', 'GLOP-1478']), {
    id: 'GLOP-1478', build: 'build-42', playwrightArgs: ['--project=chromium', '--grep', 'GLOP-1478']
  });
  assert.throws(() => parseRunArguments(['GLOP-1478', '--build']));
  assert.throws(() => parseRunArguments(['GLOP-1478', '--build', '--grep']));
});

test('evidence runs reject demo config, discovery modes, and report overrides', () => {
  for (const flag of ['--config=playwright.demo.config.ts', '-c', '-cplaywright.demo.config.ts', '-oelsewhere', '--list', '--ui', '--debug', '--pass-with-no-tests', '--reporter=json', '--output=elsewhere']) {
    assert.throws(() => parseRunArguments(['GLOP-1478', flag]));
  }
});
