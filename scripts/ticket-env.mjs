import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildEnvironment, parseServerFlags, ticketDir, validateTicketId, workspaceRoot } from './runtime.mjs';

// Saves the dev servers a ticket is tested on into its ticket.json. The new set replaces
// the previous one, which moves to environmentHistory so older run evidence stays traceable.
export async function setTicketEnvironment(root, id, urls, source = 'qa:env') {
  validateTicketId(id);
  const file = resolve(ticketDir(id, root), 'ticket.json');
  const ticket = JSON.parse(await readFile(file, 'utf8'));
  const environment = buildEnvironment(urls, source);
  const previous = ticket.environment;
  const same = previous && ['storefront', 'admin', 'api'].every(app => previous[app] === environment[app]);
  if (same) return previous;
  if (previous) ticket.environmentHistory = [...(ticket.environmentHistory || []), { ...previous, replacedAt: environment.recordedAt }];
  ticket.environment = environment;
  ticket.updatedAt = environment.recordedAt;
  await writeFile(file, JSON.stringify(ticket, null, 2) + '\n');
  return environment;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [id, ...args] = process.argv.slice(2);
    const { urls, rest } = parseServerFlags(args);
    if (rest.length) throw new Error(`Unexpected arguments: ${rest.join(' ')}. Use --storefront URL --admin URL --api URL.`);
    const environment = await setTicketEnvironment(workspaceRoot, id, urls);
    console.log(`${id} servers (${environment.brand} ${environment.server}):`);
    for (const app of ['storefront', 'admin', 'api']) console.log(`  ${app}: ${environment[app] || '(not provided)'}`);
  } catch (error) {
    console.error(`Servers not saved: ${error.message}`);
    process.exitCode = 1;
  }
}
