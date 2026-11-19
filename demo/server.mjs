import { createServer } from 'node:http';

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><title>QA harness demo</title></head>
<body><main><h1>QA harness demo</h1>
<p>This local fixture validates Playwright setup only.</p>
<form id="form"><label for="task">Task name</label>
<input id="task" name="task" required maxlength="80">
<button type="submit">Add task</button></form>
<p role="status" aria-live="polite"></p><ul aria-label="Tasks"></ul>
<script>
document.getElementById('form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('task');
  const value = input.value.trim();
  if (!value) { document.querySelector('[role="status"]').textContent = 'Enter a task name'; return; }
  const item = document.createElement('li');
  const check = document.createElement('input');
  check.type = 'checkbox'; check.setAttribute('aria-label', 'Complete ' + value);
  item.append(check, document.createTextNode(value));
  document.querySelector('ul').append(item);
  document.querySelector('[role="status"]').textContent = 'Task added';
  input.value = '';
});
</script></main></body></html>`;

const server = createServer((request, response) => {
  if (request.url === '/health') { response.writeHead(200); response.end('ok'); return; }
  if (request.url !== '/') { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(html);
});
server.listen(4179, '127.0.0.1');
