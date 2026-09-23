/**
 * Remove duplicate images/remote/*-2.webp when the base file exists,
 * and retarget products.json refs to the base path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remoteDir = path.join(root, 'apps/web/public/images/remote');
const productsFile = path.join(root, 'apps/web/public/data/products.json');

const files = fs.readdirSync(remoteDir).filter((f) => f.endsWith('.webp'));
const set = new Set(files);
let removed = 0;
let bytes = 0;
const remap = new Map();

for (const f of files) {
  const m = f.match(/^(.*)-2\.webp$/);
  if (!m) continue;
  const base = `${m[1]}.webp`;
  if (!set.has(base)) continue;
  const full = path.join(remoteDir, f);
  bytes += fs.statSync(full).size;
  fs.unlinkSync(full);
  removed++;
  remap.set(`images/remote/${f}`, `images/remote/${base}`);
}

let text = fs.readFileSync(productsFile, 'utf8');
let changed = 0;
for (const [from, to] of [...remap.entries()].sort((a, b) => b[0].length - a[0].length)) {
  if (text.includes(from)) {
    const n = text.split(from).length - 1;
    text = text.split(from).join(to);
    changed += n;
  }
}
if (changed) fs.writeFileSync(productsFile, text);

console.log({
  removedFiles: removed,
  freedMB: +(bytes / 1024 / 1024).toFixed(2),
  urlRewrites: changed,
});
