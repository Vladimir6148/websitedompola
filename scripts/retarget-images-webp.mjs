import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const imgRoot = path.join(root, 'apps/web/public/images');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const webp = new Set(
  walk(imgRoot)
    .filter((f) => f.toLowerCase().endsWith('.webp'))
    .map((f) => `images/${path.relative(imgRoot, f).replace(/\\/g, '/')}`),
);

let touches = 0;
for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  const full = path.join(dataDir, file);
  const text = fs.readFileSync(full, 'utf8');
  const next = text.replace(/images\/[A-Za-z0-9_\-./]+\.(jpe?g|png)/gi, (m) => {
    const w = m.replace(/\.(jpe?g|png)$/i, '.webp');
    return webp.has(w) ? w : m;
  });
  if (next !== text) {
    fs.writeFileSync(full, next, 'utf8');
    touches++;
    console.log('updated', file);
  }
}
console.log({ filesUpdated: touches, webpCount: webp.size });
