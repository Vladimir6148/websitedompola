import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const productsPath = path.join(root, 'apps/web/public/data/products.json');
const pricesDir = path.join(root, 'data/collection-prices');

export const CSV_HEADERS = [
  'brand',
  'brand_slug',
  'collection',
  'collection_slug',
  'match_q',
  'length_mm',
  'width_mm',
  'pack_qty',
  'pack_area',
  'price_per_m2',
  'products_count',
  'unit',
];

/** @typedef {{
 *  brand: string;
 *  brand_slug: string;
 *  collection: string;
 *  collection_slug: string;
 *  match_q: string;
 *  length_mm: number | null;
 *  width_mm: number | null;
 *  pack_qty: number | null;
 *  pack_area: number | null;
 *  price_per_m2: number;
 *  products_count: number;
 *  unit: string;
 * }} CollectionPriceRow */

function numOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows) {
  const lines = [CSV_HEADERS.join(';')];
  for (const r of rows) {
    lines.push(
      [
        r.brand,
        r.brand_slug,
        r.collection,
        r.collection_slug,
        r.match_q || '',
        r.length_mm ?? '',
        r.width_mm ?? '',
        r.pack_qty ?? '',
        r.pack_area ?? '',
        r.price_per_m2 ?? '',
        r.products_count ?? '',
        r.unit || 'м²',
      ]
        .map(escapeCsv)
        .join(';'),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function parseCsv(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    /** @type {Record<string, string>} */
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    rows.push({
      brand: obj.brand || '',
      brand_slug: obj.brand_slug || '',
      collection: obj.collection || '',
      collection_slug: obj.collection_slug || '',
      match_q: obj.match_q || '',
      length_mm: numOrNull(obj.length_mm),
      width_mm: numOrNull(obj.width_mm),
      pack_qty: numOrNull(obj.pack_qty),
      pack_area: numOrNull(obj.pack_area),
      price_per_m2: numOrNull(obj.price_per_m2) ?? 0,
      products_count: numOrNull(obj.products_count) ?? 0,
      unit: obj.unit || 'м²',
    });
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ';') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function groupKey(p) {
  if (p.collection?.slug) return `c:${p.collection.slug}`;
  const brand = p.brand?.slug || 'unknown';
  // Fallback: first two tokens after «Ламинат» / brand-ish title
  const name = String(p.name || '')
    .replace(/^Ламинат\s+/i, '')
    .trim();
  const m = name.match(/^([A-Za-zА-Яа-яЁё0-9]+(?:\s+\d+)?(?:\s+pro)?)/i);
  const label = (m?.[1] || name.split(/\s+/).slice(0, 2).join(' ')).trim();
  return `n:${brand}:${label.toLowerCase()}`;
}

/**
 * Aggregate products into collection price rows.
 * @param {any[]} products
 * @param {string} [categorySlug]
 * @returns {CollectionPriceRow[]}
 */
export function aggregateCollectionRows(products, categorySlug) {
  const filtered = categorySlug
    ? products.filter((p) => p.category?.slug === categorySlug)
    : products;

  /** @type {Map<string, { products: any[]; brand: string; brand_slug: string; collection: string; collection_slug: string; match_q: string }>} */
  const groups = new Map();

  for (const p of filtered) {
    const key = groupKey(p);
    let g = groups.get(key);
    if (!g) {
      const hasCollection = Boolean(p.collection?.slug);
      const name = String(p.name || '')
        .replace(/^Ламинат\s+/i, '')
        .trim();
      const m = name.match(/^([A-Za-zА-Яа-яЁё0-9]+(?:\s+\d+)?(?:\s+pro)?)/i);
      const fallbackLabel = (m?.[1] || name.split(/\s+/).slice(0, 2).join(' ')).trim();
      g = {
        products: [],
        brand: p.brand?.name || '',
        brand_slug: p.brand?.slug || '',
        collection: hasCollection ? p.collection?.name || '' : fallbackLabel,
        collection_slug: hasCollection ? p.collection?.slug || '' : '',
        match_q: hasCollection ? '' : fallbackLabel,
      };
      groups.set(key, g);
    }
    g.products.push(p);
  }

  /** @type {CollectionPriceRow[]} */
  const rows = [];
  for (const g of groups.values()) {
    const sample = g.products[0];
    const prices = g.products.map((p) => Number(p.price) || 0).filter((n) => n > 0);
    const modePrice = mostCommon(prices) ?? sample.price ?? 0;
    rows.push({
      brand: g.brand,
      brand_slug: g.brand_slug,
      collection: g.collection,
      collection_slug: g.collection_slug,
      match_q: g.match_q,
      length_mm: numOrNull(sample.length),
      width_mm: numOrNull(sample.width),
      pack_qty: numOrNull(sample.packQty),
      pack_area: numOrNull(sample.packArea),
      price_per_m2: modePrice,
      products_count: g.products.length,
      unit: sample.unit || 'м²',
    });
  }

  rows.sort((a, b) => {
    const br = a.brand.localeCompare(b.brand, 'ru');
    if (br) return br;
    return a.collection.localeCompare(b.collection, 'ru');
  });
  return rows;
}

function mostCommon(nums) {
  if (!nums.length) return null;
  const map = new Map();
  for (const n of nums) map.set(n, (map.get(n) || 0) + 1);
  let best = nums[0];
  let bestC = 0;
  for (const [n, c] of map) {
    if (c > bestC) {
      best = n;
      bestC = c;
    }
  }
  return best;
}

/**
 * Apply a CSV row to matching products (mutates array).
 * @param {any[]} products
 * @param {CollectionPriceRow} row
 * @param {string} [categorySlug]
 */
export function applyRowToProducts(products, row, categorySlug) {
  const now = new Date().toISOString();
  let updated = 0;
  for (const p of products) {
    if (categorySlug && p.category?.slug !== categorySlug) continue;
    if (!productMatchesRow(p, row)) continue;

    if (row.price_per_m2 != null && row.price_per_m2 >= 0) p.price = row.price_per_m2;
    p.unit = row.unit || 'м²';
    if (row.pack_area != null) p.packArea = row.pack_area;
    if (row.pack_qty != null) p.packQty = row.pack_qty;
    if (row.length_mm != null) p.length = row.length_mm;
    if (row.width_mm != null) p.width = row.width_mm;
    p.updatedAt = now;
    updated += 1;
  }
  return updated;
}

function productMatchesRow(p, row) {
  if (row.collection_slug) {
    return p.collection?.slug === row.collection_slug;
  }
  if (row.match_q) {
    const q = row.match_q.toLowerCase();
    const brandOk = !row.brand_slug || p.brand?.slug === row.brand_slug;
    return brandOk && String(p.name || '').toLowerCase().includes(q);
  }
  return false;
}

function usage() {
  console.log(`Usage:
  node scripts/collection-prices.mjs export --category laminate [--out data/collection-prices/laminate.csv]
  node scripts/collection-prices.mjs apply --file data/collection-prices/laminate.csv [--category laminate]
`);
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  if (cmd === 'export') {
    const category = get('--category') || 'laminate';
    const out =
      get('--out') || path.join(pricesDir, `${category}.csv`);
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const rows = aggregateCollectionRows(products, category);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // BOM so Excel opens UTF-8 Cyrillic correctly
    fs.writeFileSync(out, `\uFEFF${rowsToCsv(rows)}`, 'utf8');
    console.log(`Wrote ${rows.length} rows → ${out}`);
    return;
  }

  if (cmd === 'apply') {
    const file = get('--file');
    if (!file) {
      usage();
      process.exit(1);
    }
    const category = get('--category'); // optional filter
    const abs = path.isAbsolute(file) ? file : path.join(root, file);
    const rows = parseCsv(fs.readFileSync(abs, 'utf8'));
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    let total = 0;
    const summary = [];
    for (const row of rows) {
      const n = applyRowToProducts(products, row, category);
      total += n;
      summary.push({
        collection: row.collection || row.collection_slug || row.match_q,
        price: row.price_per_m2,
        updated: n,
      });
    }
    fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`);
    console.log(JSON.stringify({ total, summary }, null, 2));
    return;
  }

  usage();
  process.exit(1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
