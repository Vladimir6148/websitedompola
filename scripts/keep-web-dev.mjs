/**
 * Keep Vite (apps/web) running on 127.0.0.1:5173; restart on exit.
 * Windows: no console windows (spawn node+vite directly, windowsHide).
 *
 * Usage: node scripts/keep-web-dev.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'apps', 'web');
const viteJs = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const logFile = path.join(root, 'scripts', '_tmp', 'keep-web-dev.log');
const delayMs = 1000;

fs.mkdirSync(path.dirname(logFile), { recursive: true });

function start() {
  const stamp = new Date().toISOString();
  const line = `[keep-web ${stamp}] starting vite…\n`;
  fs.appendFileSync(logFile, line);
  const out = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, [viteJs], {
    cwd: web,
    stdio: ['ignore', out, out],
    windowsHide: true,
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    fs.appendFileSync(
      logFile,
      `[keep-web] vite exited code=${code} signal=${signal ?? ''} — restart in ${delayMs}ms\n`,
    );
    try {
      fs.closeSync(out);
    } catch {
      /* ignore */
    }
    setTimeout(start, delayMs);
  });
}

start();
