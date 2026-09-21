import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const csvPath = path.join(root, 'plintus-prices-source.csv');

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
  ['DECK HDPS', 'Deck'],
  ['Deck ', 'Deck'],
  ['DECK ', 'Deck'],
  ['Quadro', 'Quadro'],
  ['Плинтус Aberhof', 'Aberhof'],
  ['Aberhof', 'Aberhof'],
  ['Плинтус Ideal', 'Ideal'],
  ['Ideal', 'Ideal'],
  ['Плинтус Winart', 'Winart'],
  ['Winart', 'Winart'],
  ['Плинтус Лексида', 'Лексида'],
  ['Лексида', 'Лексида'],
  ['Lexida', 'Лексида'],
  ['Плинтус Arbiton', 'Arbiton'],
  ['Arbiton', 'Arbiton'],
  ['Плинтус Rico', 'Rico'],
  ['Rico', 'Rico'],
  ['Плинтус Royce', 'Royce'],
  ['Pergo', 'Pergo'],
  ['PERGO', 'Pergo'],
  ['Плинтус Pedestal', 'Pedestal'],
  ['Pedestal', 'Pedestal'],
  ['Плинтус Cezar', 'Cezar'],
  ['Cezar', 'Cezar'],
  ['Плинтус Neuhofer', 'Neuhofer'],
  ['Плинтус Дуб', 'Плинтус'],
  ['Плинтус ', 'Плинтус'],
];

function detectBrand(name, section) {
  for (const [prefix, brand] of BRAND_RULES) {
    if (name.startsWith(prefix) || name.includes(prefix)) {
      // prefer start match for Quadro/DECK
      if (name.startsWith(prefix) || ['Deck', 'Quadro', 'Pergo'].includes(brand)) {
        if (name.startsWith(prefix) || name.toLowerCase().includes(prefix.toLowerCase())) {
          if (brand === 'Deck' && /Deck|DECK/i.test(name)) return 'Deck';
          if (name.startsWith(prefix)) return brand;
        }
      }
    }
  }
  if (/^DECK|^Deck/i.test(name)) return 'Deck';
  if (/^Quadro/i.test(name)) return 'Quadro';
  if (/Pergo|PGPSK/i.test(name)) return 'Pergo';
  if (/Aberhof/i.test(name)) return 'Aberhof';
  if (/Winart/i.test(name)) return 'Winart';
  if (/Лексида|Lexida/i.test(name)) return 'Лексида';
  if (/Arbiton/i.test(name)) return 'Arbiton';
  if (/Ideal/i.test(name)) return 'Ideal';
  if (section === 'Фурнитура') {
    if (/Deck/i.test(name)) return 'Deck';
    if (/Winart/i.test(name)) return 'Winart';
    if (/Лексида|Lexida/i.test(name)) return 'Лексида';
    if (/Quadro/i.test(name)) return 'Quadro';
    return 'Фурнитура';
  }
  const m = name.match(/^Плинтус\s+(\S+)/);
  if (m) return m[1];
  return name.split(/\s+/)[0] || 'Плинтус';
}

function detectKind(name, section) {
  if (section === 'Фурнитура') {
    if (/^Угол наруж/i.test(name)) return 'Угол наружный';
    if (/^Угол внут/i.test(name)) return 'Угол внутренний';
    if (/^Угол/i.test(name)) return 'Угол';
    if (/^Заглушка/i.test(name)) return 'Заглушка';
    if (/^Соедин|^Соеден/i.test(name)) return 'Соединитель';
    return 'Фурнитура';
  }
  if (/DECK HDPS/i.test(name)) return 'Deck HDPS';
  if (/Quadro/i.test(name)) {
    const hm = name.match(/(\d+)\s*мм/);
    return hm ? `Quadro ${hm[1]} мм` : 'Quadro';
  }
  if (/Aberhof/i.test(name)) return 'Aberhof';
  return 'Плинтус';
}

function pickImage(name, section, oldUrl) {
  if (oldUrl && oldUrl.includes('images/pergo/')) return oldUrl;
  if (section === 'Фурнитура') return 'images/plintus/corner.jpg';
  const n = name.toLowerCase();
  if (/бел|white|матовый белый|орхидея/.test(n)) return 'images/plintus/white.jpg';
  if (/венге|чёрн|черн|графит|антрацит|тёмн|темн|чёрный/.test(n)) return 'images/plintus/dark.jpg';
  if (/серый|серое|пепельн|снежн|титан|рей\b|байкал|аляск/.test(n)) return 'images/plintus/grey.jpg';
  if (/дуб|ясень|каштан|орех|осина|бук/.test(n)) return 'images/plintus/oak.jpg';
  return 'images/plintus/classic.jpg';
}

function extractHeight(name) {
  const m = name.match(/(\d+)\s*мм/);
  return m ? Number(m[1]) : null;
}

function main() {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const dataRows = rows.slice(1).filter((r) => r[1]);
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

  const catBase = categories.find((c) => c.slug === 'baseboards');
  const catAcc = categories.find((c) => c.slug === 'accessories');
  if (!catBase || !catAcc) throw new Error('baseboards/accessories missing');

  // Replace previous baseboards; keep accessories that are NOT from prior plinth import (sku PL-*)
  const keep = existingProducts.filter(
    (p) =>
      p.category?.slug !== 'baseboards' &&
      !(p.category?.slug === 'accessories' && String(p.sku || '').startsWith('PLF-')),
  );
  const oldBase = existingProducts.filter((p) => p.category?.slug === 'baseboards');
  const oldByKey = new Map();
  for (const p of oldBase) {
    oldByKey.set(slugify(p.name), p);
    if (p.sku) oldByKey.set(String(p.sku).toUpperCase(), p);
  }

  const brandMap = new Map(existingBrands.map((b) => [b.slug, b]));
  const collectionMap = new Map(existingCollections.map((c) => [`${c.brandId}:${c.slug}`, c]));
  const usedSkus = new Set(keep.map((p) => p.sku));
  const usedSlugs = new Set(keep.map((p) => p.slug));
  const now = new Date().toISOString();
  const imported = [];
  const brandCounts = new Map();
  let nBase = 0;
  let nFurn = 0;

  for (const [index, cols] of dataRows.entries()) {
    const section = String(cols[0] || '').trim();
    const name = String(cols[1] || '').trim();
    if (!name) continue;
    const price = parsePrice(cols[3]);
    if (!(price > 0)) continue;

    const category = section === 'Фурнитура' ? catAcc : catBase;
    if (section === 'Фурнитура') nFurn++;
    else nBase++;

    const brandName = detectBrand(name, section);
    const brandSlug = slugify(brandName);
    if (!brandMap.has(brandSlug)) {
      brandMap.set(brandSlug, {
        id: stableId('brand', brandSlug),
        name: brandName,
        slug: brandSlug,
        logo: null,
        description: null,
        website: null,
        sortOrder: 60 + brandMap.size,
        active: true,
        createdAt: now,
        updatedAt: now,
        _count: { products: 0 },
      });
    }
    const brand = brandMap.get(brandSlug);
    const collName = detectKind(name, section);
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

    const prefix = section === 'Фурнитура' ? 'PLF' : 'PL';
    let sku = `${prefix}-${slugify(name).slice(0, 50)}`;
    let slug = slugify(`${section === 'Фурнитура' ? 'furn' : 'plintus'}-${name}`);
    if (usedSkus.has(sku)) sku = `${sku}-${index}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index}`;
    usedSkus.add(sku);
    usedSlugs.add(slug);

    const old = oldByKey.get(slugify(name)) || null;
    const imgUrl = pickImage(name, section, old?.images?.[0]?.url);
    const height = extractHeight(name);
    brandCounts.set(brandSlug, (brandCounts.get(brandSlug) || 0) + 1);

    const displayName =
      section === 'Фурнитура'
        ? name
        : name.startsWith('Плинтус')
          ? name
          : `Плинтус ${name}`;

    imported.push({
      id: old?.id || stableId('prod', sku),
      name: displayName,
      slug,
      sku,
      description: `${displayName}. Цена за 1 шт.`,
      price,
      oldPrice: null,
      discountPercent: null,
      unit: 'шт',
      packQty: null,
      packArea: null,
      thickness: null,
      wearClass: null,
      length: /2000/.test(name) ? 2000 : null,
      width: null,
      color: null,
      bevel: null,
      lockType: null,
      moistureResistant: false,
      underfloorHeating: false,
      wearLayer: null,
      seoTitle: null,
      seoDescription: null,
      published: true,
      featured: section !== 'Фурнитура' && index < 6,
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
      images: [
        {
          id: stableId('img', sku),
          url: imgUrl,
          alt: displayName,
          isPrimary: true,
          sortOrder: 0,
          storageKey: null,
        },
      ],
      characteristics: [
        { key: 'price_basis', label: 'Цена', value: 'за 1 шт.', sortOrder: 0 },
        ...(height
          ? [{ key: 'height', label: 'Высота', value: `${height} мм`, sortOrder: 1 }]
          : []),
      ],
      stocks: old?.stocks || [],
    });
  }

  for (const b of brandMap.values()) {
    if (brandCounts.has(b.slug)) {
      b._count = { products: (b._count?.products || 0) + brandCounts.get(b.slug) };
      b.updatedAt = now;
    }
  }

  catBase._count = {
    ...(catBase._count || {}),
    products: imported.filter((p) => p.category.slug === 'baseboards').length,
  };
  const accExtra = imported.filter((p) => p.category.slug === 'accessories').length;
  const accKeep = keep.filter((p) => p.category?.slug === 'accessories').length;
  catAcc._count = { ...(catAcc._count || {}), products: accKeep + accExtra };

  const nextProducts = [...keep, ...imported];
  fs.writeFileSync(productsPath, JSON.stringify(nextProducts, null, 2), 'utf8');
  fs.writeFileSync(brandsPath, JSON.stringify([...brandMap.values()], null, 2), 'utf8');
  fs.writeFileSync(collectionsPath, JSON.stringify([...collectionMap.values()], null, 2), 'utf8');
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        imported: imported.length,
        plintus: nBase,
        furnitura: nFurn,
        removedOldBaseboards: oldBase.length,
        sample: imported.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.price,
          unit: p.unit,
          cat: p.category.slug,
          img: p.images[0].url,
        })),
      },
      null,
      2,
    ),
  );
}

main();
