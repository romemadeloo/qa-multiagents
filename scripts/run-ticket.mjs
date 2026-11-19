import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { APP_URL_VARS, APPS, getApps, getTarget, inside, loadEnvironment, ticketDir as ticketPath, validateTicketId, workspaceConfig, workspaceRoot } from './runtime.mjs';

// A URL override left in .env or the shell must not silently move a ticket off its saved servers.
export function resolveTicketServers(env, ticketEnvironment, config = workspaceConfig) {
  const target = env.APP_TARGET || config.defaultTarget;
  if (ticketEnvironment) {
    for (const app of APPS) {
      const override = (app === target && env.BASE_URL) || env[APP_URL_VARS[app]];
      if (override && ticketEnvironment[app] && new URL(override).href !== ticketEnvironment[app]) {
        throw new Error(`${app} override ${override} differs from the ticket's saved server ${ticketEnvironment[app]}. Remove the override, or change the ticket with npm run qa:env.`);
      }
    }
  }
  return { target: getTarget(env, config, ticketEnvironment), apps: getApps(env, config, ticketEnvironment) };
}

export function parseRunArguments(args) {
  const [id, ...rest] = args;
  validateTicketId(id);
  let build;
  const playwrightArgs = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--build') {
      build = rest[++i];
      if (!build || build.startsWith('-')) throw new Error('--build needs the tested application build identifier.');
    } else if (/^(--config|--output|--reporter|--list|--ui|--debug|--pass-with-no-tests|--help)(=|$)|^-[coh]/.test(arg)) {
      throw new Error(`${arg} is not allowed in an evidence run. Use normal Playwright commands for discovery or debugging.`);
    } else {
      playwrightArgs.push(arg);
    }
  }
  return { id, build, playwrightArgs };
}

export async function runTicket(args) {
  loadEnvironment();
  const { id, build, playwrightArgs } = parseRunArguments(args);
  const testedBuild = build || process.env.APP_BUILD;
  if (!testedBuild) throw new Error('Provide --build BUILD or set APP_BUILD. Use the actual tested build identifier.');
  const ticketDir = ticketPath(id);
  const ticket = JSON.parse(await readFile(resolve(ticketDir, 'ticket.json'), 'utf8'));
  const { target, apps } = resolveTicketServers(process.env, ticket.environment);
  const startedAt = new Date().toISOString();
  const runId = `${startedAt.replaceAll(':', '-').replaceAll('.', '-')}-${ticket.environment ? `${ticket.environment.server}-` : ''}${target.name}-${randomUUID().slice(0, 8)}`;
  const runDir = inside(ticketDir, 'evidence', runId);
  await mkdir(runDir, { recursive: true });
  const metadata = {
    ticket: id, runId, kind: 'automation', target: target.name, baseURL: target.baseURL,
    brand: ticket.environment?.brand || 'unrecorded', server: ticket.environment?.server || 'unrecorded',
    serverSource: ticket.environment ? 'ticket.json environment' : 'qa.config.json defaults', apps,
    build: testedBuild, startedAt, runnerStatus: 'running',
    args: ['test', '--config=playwright.config.ts', ...playwrightArgs],
    note: 'Runner completion is not a release decision. Inspect test coverage, skips, retries, and results.'
  };
  await writeFile(resolve(runDir, 'run.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`Evidence: ${runDir}`);
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const result = spawnSync(process.execPath, [cli, ...metadata.args], {
    cwd: workspaceRoot, stdio: 'inherit',
    env: {
      ...process.env, QA_RUN_DIR: runDir, QA_TICKET: id, APP_TARGET: target.name, BASE_URL: target.baseURL, APP_BUILD: testedBuild
    }
  });
  const exitCode = result.status ?? 1;
  await writeFile(resolve(runDir, 'run.json'), JSON.stringify({
    ...metadata, finishedAt: new Date().toISOString(), exitCode,
    runnerStatus: result.error || result.signal ? 'interrupted' : 'finished',
    ...(result.error ? { error: result.error.message } : {}),
    ...(result.signal ? { signal: result.signal } : {})
  }, null, 2) + '\n');
  console.log(`Run finished with exit code ${exitCode}. Summarize evidence in 04-execution.md.`);
  return exitCode;
}

// Importable argument parsing is used by workspace checks; importing never runs tests.
if (process.argv[1] && resolve(process.argv[1]) === resolve(workspaceRoot, 'scripts', 'run-ticket.mjs')) {
  try { process.exitCode = await runTicket(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
