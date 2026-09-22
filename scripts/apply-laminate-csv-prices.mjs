/**
 * Apply pack prices from laminate-prices-source.csv onto EXISTING laminate products.
 * Does not create/delete SKUs. Preserves packArea/length/width.
 *
 * - If product already has packArea → price = packPrice/packArea, unit = м²
 * - Else → price = packPrice, unit = упаковка
 * - Skips overwrite when --skip-priced and product already has price>0 and packArea
 *   (keeps curated Pergo м² pricing unless --force)
 *
 * Usage:
 *   node scripts/apply-laminate-csv-prices.mjs
 *   node scripts/apply-laminate-csv-prices.mjs --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'laminate-prices-source.csv');
const productsPath = path.join(root, 'apps/web/public/data/products.json');
const FORCE = process.argv.includes('--force');

function parsePrice(raw) {
  const s = String(raw || '')
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cols = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === ';' && !q) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    return cols;
  });
}

function extractArticle(name) {
  const patterns = [
    /\b(PRK\d+[A-Z0-9-]*)\b/i,
    /\b(LF\d{2,4}-\d{2,4})\b/i,
    /\b(L\d{4}-\d{4,6})\b/i,
    /\b(V\d{4}-\d{4,6})\b/i,
    /\b(ID\d{2,4})\b/i,
    /\b(LF\d{3}-\d{2})\b/i,
    /\b(\d{4,5}(?:-\d{2})?(?:\s*HC)?)\b/i,
  ];
  for (const re of patterns) {
    const m = String(name || '').match(re);
    if (m) return m[1].toUpperCase().replace(/\s+/g, '');
  }
  return null;
}

function normKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, '');
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8')).slice(1);
/** @type {Map<string, { name: string; packPrice: number }>} */
const byArticle = new Map();
/** @type {Map<string, { name: string; packPrice: number }>} */
const byNormName = new Map();

for (const cols of rows) {
  const name = String(cols[1] || '').trim();
  if (!name) continue;
  const packPrice = parsePrice(cols[3]);
  if (!(packPrice > 0)) continue;
  const art = extractArticle(name);
  const entry = { name, packPrice };
  if (art) byArticle.set(art, entry);
  byNormName.set(normKey(name), entry);
  byNormName.set(normKey(`Ламинат ${name}`), entry);
}

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const now = new Date().toISOString();
let updated = 0;
let skippedCurated = 0;
let unmatched = 0;
const byBrand = new Map();

for (const p of products) {
  if (p.category?.slug !== 'laminate') continue;

  const art = extractArticle(p.name) || extractArticle(p.sku);
  let hit = art ? byArticle.get(art) : null;
  if (!hit) hit = byNormName.get(normKey(p.name.replace(/^Ламинат\s+/i, '')));
  if (!hit) hit = byNormName.get(normKey(p.name));
  if (!hit) {
    unmatched += 1;
    continue;
  }

  const hasPack = p.packArea != null && Number(p.packArea) > 0;
  // Keep carefully curated м² prices (Pergo etc.) unless --force
  if (!FORCE && hasPack && p.unit === 'м²' && p.price > 0) {
    skippedCurated += 1;
    continue;
  }

  if (hasPack) {
    p.price = Math.round((hit.packPrice / Number(p.packArea)) * 100) / 100;
    p.unit = 'м²';
  } else {
    p.price = hit.packPrice;
    p.unit = 'упаковка';
  }
  p.updatedAt = now;
  updated += 1;
  const b = p.brand?.name || '?';
  byBrand.set(b, (byBrand.get(b) || 0) + 1);
}

fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      csvRows: rows.length,
      articles: byArticle.size,
      updated,
      skippedCurated,
      unmatchedLaminateApprox: unmatched,
      byBrand: [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
    },
    null,
    2,
  ),
);
