import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logs = path.join(process.env.USERPROFILE || '', '.cursor', 'browser-logs');

const files = [
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-20-023Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-24-415Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-24-420Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-25-014Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-25-668Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-26-404Z.json',
  'cdp-response-Runtime.evaluate-2026-09-20T16-45-26-429Z.json',
];

function extract(file) {
  const raw = JSON.parse(fs.readFileSync(path.join(logs, file), 'utf8'));
  return JSON.parse(raw.result.value);
}

const products = files.flatMap(extract);
const categories = JSON.parse(
  fs.readFileSync(path.join(root, 'tmp-pergo', 'categories-inline.json'), 'utf8'),
);

const payload = {
  scrapedAt: new Date().toISOString(),
  source: 'https://pergo-floor.ru/',
  categories,
  products,
};

fs.writeFileSync(path.join(root, 'pergo-source.json'), JSON.stringify(payload, null, 2));
console.log(`Wrote ${products.length} products, ${categories.length} categories`);
