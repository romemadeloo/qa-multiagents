import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { getTarget, loadEnvironment, workspaceRoot } from './runtime.mjs';

loadEnvironment();
const name = process.argv[2];
try {
  const target = getTarget({ ...process.env, APP_TARGET: name, BASE_URL: '' });
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const result = spawnSync(process.execPath, [cli, 'test', '--project=chromium', ...process.argv.slice(3)], {
    cwd: workspaceRoot, stdio: 'inherit', env: { ...process.env, APP_TARGET: target.name, BASE_URL: target.baseURL }
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
