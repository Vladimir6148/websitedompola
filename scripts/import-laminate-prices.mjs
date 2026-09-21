import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const csvPath = path.join(root, 'laminate-prices-source.csv');

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

/** Known brand prefixes (longest first). */
const BRAND_RULES = [
  ['Alpine floor', 'Alpine Floor'],
  ['Alpine Floor', 'Alpine Floor'],
  ['Clix Floor', 'Clix Floor'],
  ['Quick-Step', 'Quick-Step'],
  ['Quick Step', 'Quick-Step'],
  ['Tarkett Navigator', 'Tarkett'],
  ['Tarkett Estetica', 'Tarkett'],
  ['Tarkett Trophy', 'Tarkett'],
  ['Tarkett Cinema', 'Tarkett'],
  ['Tarkett', 'Tarkett'],
  ['Kronostar', 'Kronostar'],
  ['Kronospan', 'Kronospan'],
  ['Woodstyle', 'Woodstyle'],
  ['WOODSTYLE', 'Woodstyle'],
  ['FloorFort', 'FloorFort'],
  ['Floor Fort', 'FloorFort'],
  ['Herringbone', 'Herringbone'],
  ['Goteborg', 'Pergo'],
  ['Göteborg', 'Pergo'],
  ['PERGO', 'Pergo'],
  ['Pergo', 'Pergo'],
  ['Egger', 'Egger'],
  ['Classen', 'Classen'],
  ['Kaindl', 'Kaindl'],
  ['Vitality', 'Vitality'],
  ['Castello', 'Castello'],
  ['Uppsala', 'Uppsala'],
  ['Timber', 'Timber'],
  ['Elegant', 'Elegant'],
  ['EFFECT', 'Effect'],
  ['Effect', 'Effect'],
  ['Skara', 'Skara'],
  ['Deck', 'Deck'],
  ['Form', 'Form'],
  ['AGT', 'AGT'],
  ['Westin', 'Westin'],
  ['Ritter', 'Ritter'],
];

function detectBrand(name) {
  for (const [prefix, brand] of BRAND_RULES) {
    if (name.startsWith(prefix) || name.toLowerCase().startsWith(prefix.toLowerCase())) {
      return brand;
    }
  }
  const first = name.split(/\s+/)[0] || 'Ламинат';
  return first;
}

function detectCollection(name, brand) {
  // AGT Bering / AGT Marco Polo Premium
  if (brand === 'AGT') {
    const m = name.match(/^AGT\s+(.+?)\s+PRK/i);
    if (m) return `AGT ${m[1].trim()}`;
  }
  if (brand === 'Alpine Floor') {
    const m = name.match(/^Alpine\s+floor\s+(LF\d+)/i);
    if (m) return `Alpine Floor ${m[1].toUpperCase()}`;
    return 'Alpine Floor';
  }
  if (brand === 'Tarkett') {
    const m = name.match(/^Tarkett\s+(\S+)/i);
    if (m && !/^\d/.test(m[1])) return `Tarkett ${m[1]}`;
  }
  if (brand === 'Clix Floor') return 'Clix Floor';
  if (brand === 'Pergo') {
    const m = name.match(/\b(L\d{4}|V\d{4})\b/i);
    if (m) return `Pergo ${m[1].toUpperCase()}`;
    return 'Pergo';
  }
  // second word if Latin-ish
  const parts = name.split(/\s+/);
  if (parts.length >= 2 && /^[A-Za-zА-Яа-яЁё]/.test(parts[1])) {
    return `${brand} ${parts[1]}`.slice(0, 60);
  }
  return brand;
}

function extractArticle(name) {
  const patterns = [
    /\b(PRK\d+[A-Z0-9-]*)\b/i,
    /\b(LF\d{2,4}-\d{2,4})\b/i,
    /\b(L\d{4}-\d{4,6})\b/i,
    /\b(V\d{4}-\d{4,6})\b/i,
    /\b(\d{5})\b/,
    /\b([A-Z]{1,3}\d{3,6}[A-Z0-9-]*)\b/,
  ];
  for (const re of patterns) {
    const m = name.match(re);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function main() {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(raw);
  const header = rows[0] || [];
  const dataRows = rows.slice(1).filter((r) => r.length >= 4 && r[1]);

  console.log('header', header);
  console.log('rows', dataRows.length);

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

  const category = categories.find((c) => c.slug === 'laminate');
  if (!category) throw new Error('laminate category missing');

  const keep = existingProducts.filter((p) => p.category?.slug !== 'laminate');
  const oldLaminate = existingProducts.filter((p) => p.category?.slug === 'laminate');

  // index old images by article / sku fragment
  const oldByArticle = new Map();
  for (const p of oldLaminate) {
    const art = extractArticle(p.name) || extractArticle(p.sku || '');
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
        sortOrder: 50 + brandMap.size,
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

    const article = extractArticle(name);
    let sku = article ? `LAM-${article}` : `LAM-${slugify(name).slice(0, 40)}-${index}`;
    let slug = slugify(`laminat-${name}`);
    if (usedSkus.has(sku)) sku = `${sku}-${index}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index}`;
    usedSkus.add(sku);
    usedSlugs.add(slug);

    const old = (article && oldByArticle.get(article.toUpperCase())) || null;
    const images =
      old?.images?.length
        ? old.images
        : [
            {
              id: stableId('img', sku),
              url: 'images/floor1.jpg',
              alt: name,
              isPrimary: true,
              sortOrder: 0,
              storageKey: null,
            },
          ];

    brandCounts.set(brandSlug, (brandCounts.get(brandSlug) || 0) + 1);

    imported.push({
      id: old?.id || stableId('prod', sku),
      name: `Ламинат ${name}`,
      slug,
      sku,
      description: `Ламинат ${name}. Цена указана за упаковку.`,
      price: packPrice,
      oldPrice: null,
      discountPercent: null,
      unit: 'упаковка',
      packQty: null,
      packArea: null,
      thickness: old?.thickness ?? null,
      wearClass: old?.wearClass ?? null,
      length: old?.length ?? null,
      width: old?.width ?? null,
      color: old?.color ?? null,
      bevel: old?.bevel ?? null,
      lockType: old?.lockType ?? null,
      moistureResistant: old?.moistureResistant ?? false,
      underfloorHeating: old?.underfloorHeating ?? false,
      wearLayer: old?.wearLayer ?? null,
      seoTitle: null,
      seoDescription: null,
      published: true,
      featured: Boolean(old?.featured) || index < 8,
      sortOrder: index,
      categoryId: category.id,
      brandId: brand.id,
      collectionId: collection.id,
      createdAt: old?.createdAt || now,
      updatedAt: now,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        brandId: brand.id,
      },
      images,
      characteristics: [
        { key: 'price_basis', label: 'Цена', value: 'за упаковку', sortOrder: 0 },
        ...(article
          ? [{ key: 'article', label: 'Артикул', value: article, sortOrder: 1 }]
          : []),
      ],
      stocks: old?.stocks || [],
    });
  }

  for (const b of brandMap.values()) {
    b._count = { products: brandCounts.get(b.slug) || b._count?.products || 0 };
    if (brandCounts.has(b.slug)) b.updatedAt = now;
  }

  const nextProducts = [...keep, ...imported];
  category._count = { ...(category._count || {}), products: imported.length };

  // Refresh home featured: keep non-laminate featured + first priced laminate
  const featuredKeep = (home.featured || []).filter((p) => p.category?.slug !== 'laminate');
  const featuredLam = imported.filter((p) => p.price > 0).slice(0, 4);
  home.featured = [...featuredLam, ...featuredKeep].slice(0, 12);
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
        removedOldLaminate: oldLaminate.length,
        brands: brandCounts.size,
        sample: imported.slice(0, 3).map((p) => ({ name: p.name, price: p.price, unit: p.unit, brand: p.brand.name })),
        topBrands: [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
      },
      null,
      2,
    ),
  );
}

main();
