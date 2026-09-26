/**
 * Slim products.json + split by category + bake homepage related products.
 * Run: node scripts/optimize-catalog-json.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'apps/web/public/data');
const shardsDir = path.join(dataDir, 'products-by-category');

const RELATED_SLUGS = [
  'podlozhka-xps-3mm',
  'plintus-pvh-dub-natural',
  'klej-dlya-spc',
  'podlozhka-khvoynaya-7mm',
  'plintus-mdf-belyj-80',
];

function slimProduct(p) {
  const img = p.images?.[0];
  const url = typeof img === 'string' ? img : img?.url;
  const out = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    unit: p.unit || 'м²',
    published: p.published !== false,
    featured: Boolean(p.featured),
    moistureResistant: Boolean(p.moistureResistant),
    underfloorHeating: Boolean(p.underfloorHeating),
    sortOrder: p.sortOrder || 0,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : undefined,
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : undefined,
    images: url ? [{ url, isPrimary: true }] : [],
  };
  if (p.oldPrice != null && p.oldPrice > 0) out.oldPrice = p.oldPrice;
  if (p.packArea != null) out.packArea = p.packArea;
  if (p.packQty != null) out.packQty = p.packQty;
  if (p.thickness != null) out.thickness = p.thickness;
  if (p.wearClass) out.wearClass = p.wearClass;
  if (p.length != null) out.length = p.length;
  if (p.width != null) out.width = p.width;
  if (p.color) out.color = p.color;
  if (p.bevel) out.bevel = p.bevel;
  if (p.lockType) out.lockType = p.lockType;
  if (p.wearLayer) out.wearLayer = p.wearLayer;
  if (p.collection) {
    out.collection = {
      id: p.collection.id,
      name: p.collection.name,
      slug: p.collection.slug,
      brandId: p.collection.brandId,
    };
  }
  return out;
}

function kb(n) {
  return `${(n / 1024).toFixed(0)}KB`;
}

const rawPath = path.join(dataDir, 'products.json');
const before = fs.statSync(rawPath).size;
const products = JSON.parse(fs.readFileSync(rawPath, 'utf8')).map(slimProduct);

fs.mkdirSync(shardsDir, { recursive: true });
for (const f of fs.readdirSync(shardsDir)) {
  if (f.endsWith('.json')) fs.unlinkSync(path.join(shardsDir, f));
}

const byCat = new Map();
for (const p of products) {
  const slug = p.category?.slug || '_other';
  if (!byCat.has(slug)) byCat.set(slug, []);
  byCat.get(slug).push(p);
}

const manifest = {};
for (const [slug, items] of [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const file = `${slug}.json`;
  const body = JSON.stringify(items);
  fs.writeFileSync(path.join(shardsDir, file), body);
  manifest[slug] = { file: `products-by-category/${file}`, count: items.length, bytes: body.length };
  console.log(`shard ${slug}: ${items.length} ${kb(body.length)}`);
}

fs.writeFileSync(path.join(dataDir, 'products-manifest.json'), JSON.stringify(manifest));
const slimAll = JSON.stringify(products);
fs.writeFileSync(rawPath, slimAll);
const gz = zlib.gzipSync(Buffer.from(slimAll), { level: 9 });
console.log(
  `products.json ${products.length}: ${kb(before)} → ${kb(slimAll.length)} (gzip ${kb(gz.length)})`,
);

// Bake related into home.json so homepage never loads products.json
const homePath = path.join(dataDir, 'home.json');
const home = JSON.parse(fs.readFileSync(homePath, 'utf8'));
const bySlug = new Map(products.map((p) => [p.slug, p]));
const related = [];
for (const s of RELATED_SLUGS) {
  const p = bySlug.get(s);
  if (p) related.push(p);
}
if (related.length < 4) {
  for (const slug of ['underlayment', 'baseboards', 'accessories']) {
    for (const p of byCat.get(slug) || []) {
      if (related.some((r) => r.id === p.id)) continue;
      related.push(p);
      if (related.length >= 4) break;
    }
    if (related.length >= 4) break;
  }
}
home.related = related.slice(0, 4);

// Deals: discounted first, else featured mix (max 8)
const discounted = products.filter((p) => p.oldPrice && p.oldPrice > p.price);
const deals = [];
const seen = new Set();
for (const p of [...discounted, ...(home.featured || []), ...products.filter((p) => p.featured)]) {
  if (!p?.id || seen.has(p.id)) continue;
  seen.add(p.id);
  deals.push(p);
  if (deals.length >= 8) break;
}
home.deals = deals;
home.updatedAt = new Date().toISOString();
fs.writeFileSync(homePath, JSON.stringify(home));
console.log(`home.json deals=${home.deals.length} related=${home.related.length} ${kb(fs.statSync(homePath).size)}`);
console.log('Done.');
