/**
 * If nothing listens on 127.0.0.1:5173, start keep-web-dev detached.
 * Safe to call repeatedly (sessionStart / manual).
 */
import net from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keepScript = path.join(root, 'scripts', 'keep-web-dev.mjs');
const logFile = path.join(root, 'scripts', '_tmp', 'keep-web-dev.log');

function portOpen(host, port, ms = 400) {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port }, () => {
      sock.end();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.setTimeout(ms, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (await portOpen('127.0.0.1', 5173)) {
    console.log('vite already on :5173');
    return;
  }

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const out = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, [keepScript], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
    env: process.env,
  });
  child.unref();
  console.log(`started keep-web-dev pid=${child.pid} log=${logFile}`);

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await portOpen('127.0.0.1', 5173)) {
      console.log('vite ready on http://127.0.0.1:5173/');
      return;
    }
  }
  console.warn('vite not ready yet — check', logFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
