import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const csvPath = path.join(root, 'pvh-prices-source.csv');

function slugify(input) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return String(input)
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function stableId(prefix, key) {
  const h = createHash('sha1').update(String(key)).digest('hex').slice(0, 16);
  return `${prefix}_${h}`;
}

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

const BRAND_RULES = [
  ['Chevron Alpine', 'Alpine Floor'],
  ['Alpine Floor', 'Alpine Floor'],
  ['Alpine floor', 'Alpine Floor'],
  ['Grand Sequoia', 'Alpine Floor'],
  ['Alta Step', 'Alta Step'],
  ['Alta ', 'Alta Step'],
  ['AquaFloor', 'Aquafloor'],
  ['Aquafloor', 'Aquafloor'],
  ["L'Quarzo", "L'Quarzo"],
  ['StoneFloor', 'Stone Floor'],
  ['Stone Floor', 'Stone Floor'],
  ['Stonewood', 'Stonewood'],
  ['Primavera', 'Primavera'],
  ['Premium XL', 'Premium XL'],
  ['Premium', 'Premium'],
  ['Parquet', 'Parquet'],
  ['Tarkett', 'Tarkett'],
  ['Bonkeel', 'Bonkeel'],
  ['Natura', 'Natura'],
  ['Amadei', 'Amadei'],
  ['Royce', 'Royce'],
  ['Betta', 'Betta'],
  ['Sigrid', 'Sigrid'],
  ['Damy', 'Damy'],
  ['Light', 'Light'],
  ['Zeta', 'Zeta'],
  ['Pergo', 'Pergo'],
  ['PERGO', 'Pergo'],
];

function detectBrand(name) {
  for (const [prefix, brand] of BRAND_RULES) {
    if (name.startsWith(prefix) || name.toLowerCase().startsWith(prefix.toLowerCase())) {
      return brand;
    }
  }
  return name.split(/\s+/)[0] || 'ПВХ';
}

function detectCollection(name, brand) {
  if (brand === 'Alpine Floor') {
    if (/Chevron/i.test(name)) return 'Chevron Alpine ECO';
    if (/Grand Sequoia/i.test(name)) {
      const m = name.match(/Grand Sequoia\s+([^\dECO]+)?(?:ECO\s*)?(\d+[-\d]*)/i);
      return m ? `Grand Sequoia ${m[2] || ''}`.trim() : 'Grand Sequoia';
    }
    const m = name.match(/Alpine\s+(?:Floor\s+)?(\S+)/i);
    if (m) return `Alpine Floor ${m[1]}`;
  }
  if (brand === 'Alta Step') {
    const m = name.match(/Alta\s+Step\s+(.+?)(?:\s+\d|$)/i) || name.match(/Alta\s+(.+?)(?:\s+\d|$)/i);
    if (m) return `Alta Step ${m[1].trim()}`.slice(0, 50);
    return 'Alta Step';
  }
  if (brand === 'Aquafloor') {
    const m = name.match(/Aquafloor\s+(\S+)/i) || name.match(/AquaFloor\s+(\S+)/i);
    if (m) return `Aquafloor ${m[1]}`;
  }
  if (brand === 'Zeta') {
    const m = name.match(/^Zeta\s+(.+?)\s+\d/i);
    if (m) return `Zeta ${m[1].trim()}`;
  }
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return `${brand} ${parts[1]}`.slice(0, 60);
  return brand;
}

function extractArticle(name, explicit) {
  if (explicit && String(explicit).trim()) return String(explicit).trim().toUpperCase();
  const patterns = [
    /\b(ECO\s*\d+[-\d]*\s*MC)\b/i,
    /\b(ECO\s*\d+[-\d]*)\b/i,
    /\b(\d{4}-\d+)\b/,
    /\b(V\d{4}-\d+)\b/i,
    /\b(L\d{4}-\d+)\b/i,
    /\b([A-Z]{2,}\d{3,}[A-Z0-9-]*)\b/i,
  ];
  for (const re of patterns) {
    const m = name.match(re);
    if (m) return m[1].replace(/\s+/g, ' ').toUpperCase();
  }
  return null;
}

function main() {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(raw);
  const dataRows = rows.slice(1).filter((r) => r.length >= 4 && r[1]);
  console.log('rows', dataRows.length, 'header', rows[0]);

  const productsPath = path.join(dataDir, 'products.json');
  const brandsPath = path.join(dataDir, 'brands.json');
  const collectionsPath = path.join(dataDir, 'collections.json');
  const categoriesPath = path.join(dataDir, 'categories.json');
  const homePath = path.join(dataDir, 'home.json');

  const existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const existingBrands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
  const existingCollections = fs.existsSync(collectionsPath)
    ? JSON.parse(fs.readFileSync(collectionsPath, 'utf8'))
    : [];
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'));

  const category = categories.find((c) => c.slug === 'quartzvinyl-spc');
  if (!category) throw new Error('quartzvinyl-spc category missing');

  const keep = existingProducts.filter((p) => p.category?.slug !== 'quartzvinyl-spc');
  const oldSpc = existingProducts.filter((p) => p.category?.slug === 'quartzvinyl-spc');

  const oldByArticle = new Map();
  for (const p of oldSpc) {
    const art = extractArticle(p.name, null) || extractArticle(p.sku || '', null);
    if (art) oldByArticle.set(art.toUpperCase(), p);
    if (p.sku) oldByArticle.set(String(p.sku).toUpperCase(), p);
  }

  const brandMap = new Map(existingBrands.map((b) => [b.slug, b]));
  const collectionMap = new Map(existingCollections.map((c) => [`${c.brandId}:${c.slug}`, c]));
  const usedSkus = new Set(keep.map((p) => p.sku));
  const usedSlugs = new Set(keep.map((p) => p.slug));
  const now = new Date().toISOString();
  const imported = [];
  const brandCounts = new Map();

  for (const [index, cols] of dataRows.entries()) {
    const name = String(cols[1] || '').trim();
    if (!name) continue;
    const packPrice = parsePrice(cols[3]);
    if (!(packPrice > 0)) continue;
    const explicitArt = cols[4];

    const brandName = detectBrand(name);
    const brandSlug = slugify(brandName);
    if (!brandMap.has(brandSlug)) {
      brandMap.set(brandSlug, {
        id: stableId('brand', brandSlug),
        name: brandName,
        slug: brandSlug,
        logo: null,
        description: null,
        website: null,
        sortOrder: 40 + brandMap.size,
        active: true,
        createdAt: now,
        updatedAt: now,
        _count: { products: 0 },
      });
    }
    const brand = brandMap.get(brandSlug);

    const collName = detectCollection(name, brandName);
    const collSlug = slugify(collName);
    const collKey = `${brand.id}:${collSlug}`;
    if (!collectionMap.has(collKey)) {
      collectionMap.set(collKey, {
        id: stableId('coll', collKey),
        name: collName,
        slug: collSlug,
        brandId: brand.id,
        createdAt: now,
        updatedAt: now,
      });
    }
    const collection = collectionMap.get(collKey);

    const article = extractArticle(name, explicitArt);
    let sku = article ? `PVH-${article.replace(/\s+/g, '')}` : `PVH-${slugify(name).slice(0, 40)}-${index}`;
    let slug = slugify(`kv-${name}`);
    if (usedSkus.has(sku)) sku = `${sku}-${index}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index}`;
    usedSkus.add(sku);
    usedSlugs.add(slug);

    const old =
      (article && oldByArticle.get(article.toUpperCase())) ||
      (article && oldByArticle.get(`PVH-${article.replace(/\s+/g, '')}`.toUpperCase())) ||
      null;

    const images = old?.images?.length
      ? old.images
      : [
          {
            id: stableId('img', sku),
            url: 'images/floor2.jpg',
            alt: name,
            isPrimary: true,
            sortOrder: 0,
            storageKey: null,
          },
        ];

    brandCounts.set(brandSlug, (brandCounts.get(brandSlug) || 0) + 1);

    imported.push({
      id: old?.id || stableId('prod', sku),
      name: name.startsWith('ПВХ') ? name : `ПВХ ${name}`,
      slug,
      sku,
      description: `${name}. Цена указана за пачку (упаковку).`,
      price: packPrice,
      oldPrice: null,
      discountPercent: null,
      unit: 'пачка',
      packQty: null,
      packArea: null,
      thickness: old?.thickness ?? null,
      wearClass: old?.wearClass ?? null,
      length: old?.length ?? null,
      width: old?.width ?? null,
      color: old?.color ?? null,
      bevel: old?.bevel ?? null,
      lockType: old?.lockType ?? null,
      moistureResistant: true,
      underfloorHeating: old?.underfloorHeating ?? true,
      wearLayer: old?.wearLayer ?? null,
      seoTitle: null,
      seoDescription: null,
      published: true,
      featured: Boolean(old?.featured) || index < 6,
      sortOrder: index,
      categoryId: category.id,
      brandId: brand.id,
      collectionId: collection.id,
      createdAt: old?.createdAt || now,
      updatedAt: now,
      category: { id: category.id, name: category.name, slug: category.slug },
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        brandId: brand.id,
      },
      images,
      characteristics: [
        { key: 'price_basis', label: 'Цена', value: 'за пачку', sortOrder: 0 },
        ...(article
          ? [{ key: 'article', label: 'Артикул', value: article, sortOrder: 1 }]
          : []),
      ],
      stocks: old?.stocks || [],
    });
  }

  for (const b of brandMap.values()) {
    if (brandCounts.has(b.slug)) {
      b._count = { products: brandCounts.get(b.slug) };
      b.updatedAt = now;
    }
  }

  category._count = { ...(category._count || {}), products: imported.length };
  const nextProducts = [...keep, ...imported];

  const featuredKeep = (home.featured || []).filter((p) => p.category?.slug !== 'quartzvinyl-spc');
  const featuredPvh = imported.filter((p) => p.price > 0).slice(0, 4);
  home.featured = [...featuredPvh, ...featuredKeep].slice(0, 12);
  home.updatedAt = now;

  fs.writeFileSync(productsPath, JSON.stringify(nextProducts, null, 2), 'utf8');
  fs.writeFileSync(brandsPath, JSON.stringify([...brandMap.values()], null, 2), 'utf8');
  fs.writeFileSync(collectionsPath, JSON.stringify([...collectionMap.values()], null, 2), 'utf8');
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        imported: imported.length,
        keptOther: keep.length,
        removedOldSpc: oldSpc.length,
        brands: brandCounts.size,
        sample: imported.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.price,
          unit: p.unit,
          brand: p.brand.name,
        })),
        topBrands: [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
      },
      null,
      2,
    ),
  );
}

main();
