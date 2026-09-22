/**
 * Keep Vite (apps/web) running on 127.0.0.1:5173; restart on exit.
 * Usage: node scripts/keep-web-dev.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'apps', 'web');
const delayMs = 1000;

function start() {
  const stamp = new Date().toISOString();
  console.log(`[keep-web ${stamp}] starting vite…`);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'dev'], {
    cwd: web,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    console.log(
      `[keep-web] vite exited code=${code} signal=${signal ?? ''} — restart in ${delayMs}ms`,
    );
    setTimeout(start, delayMs);
  });
}

start();
