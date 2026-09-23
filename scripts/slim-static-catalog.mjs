/**
 * Slim static catalog for the storefront.
 * - products.json — lightweight list (catalog / home / filters)
 * - product-details.json — description / extra images / characteristics by slug
 *
 * Usage: node scripts/slim-static-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'apps/web/public/data');
const file = path.join(dataDir, 'products.json');

function slimRef(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const out = {};
  for (const k of ['id', 'name', 'slug']) {
    if (obj[k] != null && obj[k] !== '') out[k] = obj[k];
  }
  return Object.keys(out).length ? out : undefined;
}

function slimImage(img) {
  if (!img?.url) return null;
  const out = { url: img.url };
  if (img.alt) out.alt = img.alt;
  if (img.isPrimary) out.isPrimary = true;
  if (typeof img.sortOrder === 'number' && img.sortOrder !== 0) out.sortOrder = img.sortOrder;
  return out;
}

function slimChar(c) {
  if (!c?.value) return null;
  return { key: c.key || '', label: c.label || c.key || '', value: c.value };
}

function pickPrimaryImages(images) {
  const all = (images || []).map(slimImage).filter(Boolean);
  const primary = all.filter((i) => i.isPrimary);
  return (primary.length ? primary : all).slice(0, 1);
}

function listProduct(p) {
  const out = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price ?? 0,
    unit: p.unit || 'm2',
    published: p.published !== false,
    featured: !!p.featured,
    moistureResistant: !!p.moistureResistant,
    underfloorHeating: !!p.underfloorHeating,
    categoryId: p.categoryId,
    brandId: p.brandId,
    images: pickPrimaryImages(p.images),
  };

  for (const k of [
    'oldPrice',
    'discountPercent',
    'packQty',
    'packArea',
    'thickness',
    'wearClass',
    'length',
    'width',
    'color',
    'bevel',
    'lockType',
    'wearLayer',
    'collectionId',
    'sortOrder',
  ]) {
    const v = p[k];
    if (v == null || v === '') continue;
    out[k] = v;
  }

  const category = slimRef(p.category);
  const brand = slimRef(p.brand);
  const collection = slimRef(p.collection);
  if (category) out.category = category;
  if (brand) out.brand = brand;
  if (collection) out.collection = collection;
  return out;
}

function detailProduct(p) {
  const images = (p.images || []).map(slimImage).filter(Boolean);
  const primary = pickPrimaryImages(p.images);
  const primaryUrl = primary[0]?.url;
  const extra = images.filter((i) => i.url !== primaryUrl);
  const characteristics = (p.characteristics || []).map(slimChar).filter(Boolean);
  const out = {};
  if (p.description) out.description = p.description;
  if (characteristics.length) out.characteristics = characteristics;
  if (extra.length) out.images = extra;
  if (p.seoTitle) out.seoTitle = p.seoTitle;
  if (p.seoDescription) out.seoDescription = p.seoDescription;
  return Object.keys(out).length ? out : null;
}

function writeMin(name, data) {
  const full = path.join(dataDir, name);
  const before = fs.existsSync(full) ? fs.statSync(full).size : 0;
  const text = JSON.stringify(data);
  fs.writeFileSync(full, text);
  const after = Buffer.byteLength(text);
  const pct = before ? Math.round((1 - after / before) * 100) : 0;
  console.log(
    `${name}: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${pct}%)`,
  );
}

const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const products = raw.filter((p) => p.published !== false);

const list = products.map(listProduct);
const details = {};
for (const p of products) {
  const d = detailProduct(p);
  if (d) details[p.slug] = d;
}

writeMin('products.json', list);
writeMin('product-details.json', details);

for (const name of ['brands.json', 'categories.json', 'collections.json', 'home.json', 'cities.json', 'stores.json', 'promotions.json', 'services.json', 'works.json']) {
  const full = path.join(dataDir, name);
  if (!fs.existsSync(full)) continue;
  const before = fs.statSync(full).size;
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  // brands/categories: keep slim embeds only
  let next = data;
  if (name === 'brands.json') {
    next = data.map((b) => {
      const o = {
        id: b.id,
        name: b.name,
        slug: b.slug,
        sortOrder: b.sortOrder ?? 0,
        active: b.active !== false,
      };
      if (b.logo) o.logo = b.logo;
      if (b.description) o.description = b.description;
      if (b.website) o.website = b.website;
      if (b._count) o._count = b._count;
      return o;
    });
  }
  if (name === 'categories.json') {
    next = data.map((c) => {
      const o = {
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder ?? 0,
        active: c.active !== false,
      };
      if (c.description) o.description = c.description;
      if (c.image) o.image = c.image;
      if (c.filterSchema) o.filterSchema = c.filterSchema;
      if (c._count) o._count = c._count;
      return o;
    });
  }
  const text = JSON.stringify(next);
  if (Buffer.byteLength(text) <= before) {
    fs.writeFileSync(full, text);
    console.log(
      `${name}: ${(before / 1024).toFixed(0)}KB → ${(Buffer.byteLength(text) / 1024).toFixed(0)}KB`,
    );
  }
}
