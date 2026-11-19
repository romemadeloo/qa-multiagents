import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildEnvironment, inside, parseServerFlags, ticketsRoot, validateTicketId, workspaceConfig, workspaceRoot } from './runtime.mjs';

export async function createTicket(root, id, title = 'Title pending', servers = {}, source = 'qa:new') {
  validateTicketId(id);
  // Validate the servers before anything is written so a refused URL leaves no folder behind.
  const environment = Object.keys(servers).length ? buildEnvironment(servers, source) : undefined;
  const templateDir = resolve(root, 'templates', 'ticket');
  const names = (await readdir(templateDir)).sort();
  const createdAt = new Date().toISOString();
  const documents = await Promise.all(names.map(async (name) => {
    const content = await readFile(resolve(templateDir, name), 'utf8');
    return [name, content.replaceAll('{{TICKET_ID}}', id).replaceAll('{{TITLE}}', title).replaceAll('{{DATE}}', createdAt)];
  }));
  const ticketsDir = ticketsRoot(root);
  await mkdir(ticketsDir, { recursive: true });
  const ticketDir = inside(ticketsDir, id);
  // Exclusive directory creation prevents overwriting an existing ticket.
  await mkdir(ticketDir);
  for (const [name, content] of documents) await writeFile(resolve(ticketDir, name), content, { flag: 'wx' });
  await mkdir(resolve(ticketDir, 'evidence'));
  await writeFile(resolve(ticketDir, 'evidence', '.gitkeep'), '');
  await writeFile(resolve(ticketDir, 'ticket.json'), JSON.stringify({
    id, title, sourceUrl: workspaceConfig.ticketUrlTemplate.replace('{id}', id),
    createdAt, updatedAt: createdAt, phase: 'intake', status: 'needs_requirements',
    target: 'unconfirmed', build: 'unconfirmed', releaseDecision: 'not_assessed',
    ...(environment ? { environment } : {}),
    phases: Object.fromEntries(['intake', 'planning', 'cases', 'automation', 'execution', 'defects', 'release'].map(p => [p, 'pending']))
  }, null, 2) + '\n', { flag: 'wx' });
  return ticketDir;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { urls, rest } = parseServerFlags(process.argv.slice(3));
    const directory = await createTicket(workspaceRoot, process.argv[2], rest.join(' ') || undefined, urls);
    console.log(`Created ${directory}. Start with 00-intake.md.`);
    if (!Object.keys(urls).length) console.log(`No servers saved. Record them with: npm run qa:env -- ${process.argv[2]} --storefront URL --admin URL --api URL`);
  } catch (error) {
    console.error(`Ticket not created: ${error.message}`);
    process.exitCode = 1;
  }
}
