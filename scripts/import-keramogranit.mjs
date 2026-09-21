import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const csvPath = path.join(root, 'keramogranit-prices-source.csv');
const imageMapPath = path.join(root, 'primavera-image-map.json');

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

function extractArticle(name) {
  const m = name.match(/\(([A-Za-z0-9_]+)\)/);
  return m ? m[1].toUpperCase() : null;
}

function detectBrand(name) {
  if (/^Royce/i.test(name)) return 'Royce';
  if (/^Primavera/i.test(name)) return 'Primavera';
  return name.split(/\s+/)[0] || 'Керамогранит';
}

function detectCollection(name, brand, article) {
  if (article) {
    const prefix = article.replace(/\d+$/, '').replace(/_$/, '');
    if (prefix && prefix !== article) return `${brand} ${prefix}`;
  }
  return brand;
}

function guessSizeMm(article, name) {
  // CR1xx / PR1xx often 60x60; CR2xx / PR2xx 60x120; WD* 20x120
  if (/^WD/i.test(article || '')) return { length: 1200, width: 200 };
  if (/^(CR|PR|GR)2/i.test(article || '')) return { length: 1200, width: 600 };
  if (/^(CR|PR|GR)1/i.test(article || '')) return { length: 600, width: 600 };
  if (/60\s*[xх]\s*120/i.test(name)) return { length: 1200, width: 600 };
  if (/20\s*[xхh]\s*120/i.test(name)) return { length: 1200, width: 200 };
  return { length: null, width: null };
}

function main() {
  const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const dataRows = rows.slice(1).filter((r) => r[1]);
  console.log('rows', dataRows.length, 'images', Object.keys(imageMap).length);

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

  const category = categories.find((c) => c.slug === 'porcelain');
  if (!category) throw new Error('porcelain category missing');

  const keep = existingProducts.filter((p) => p.category?.slug !== 'porcelain');
  const brandMap = new Map(existingBrands.map((b) => [b.slug, b]));
  const collectionMap = new Map(existingCollections.map((c) => [`${c.brandId}:${c.slug}`, c]));
  const usedSkus = new Set(keep.map((p) => p.sku));
  const usedSlugs = new Set(keep.map((p) => p.slug));
  const now = new Date().toISOString();
  const imported = [];
  const brandCounts = new Map();
  let withImg = 0;

  for (const [index, cols] of dataRows.entries()) {
    const name = String(cols[1] || '').trim();
    if (!name) continue;
    // price is column index 4 in header: Категория;Наименование;Свободно;Картинка остатки;Розничная цена;Артикул
    const price = parsePrice(cols[4] || cols[3]);
    if (!(price > 0)) continue;

    const article = extractArticle(name) || (cols[5] ? String(cols[5]).trim().toUpperCase() : null);
    const brandName = detectBrand(name);
    const brandSlug = slugify(brandName);
    if (!brandMap.has(brandSlug)) {
      brandMap.set(brandSlug, {
        id: stableId('brand', brandSlug),
        name: brandName,
        slug: brandSlug,
        logo: null,
        description: brandName === 'Primavera' ? 'Керамогранит Primavera' : null,
        website: brandName === 'Primavera' ? 'https://primavera-opt.ru/' : null,
        sortOrder: 20 + brandMap.size,
        active: true,
        createdAt: now,
        updatedAt: now,
        _count: { products: 0 },
      });
    }
    const brand = brandMap.get(brandSlug);
    const collName = detectCollection(name, brandName, article);
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

    let sku = article ? `KER-${article}` : `KER-${slugify(name).slice(0, 40)}-${index}`;
    let slug = slugify(`keramogranit-${name}`);
    if (usedSkus.has(sku)) sku = `${sku}-${index}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index}`;
    usedSkus.add(sku);
    usedSlugs.add(slug);

    const media = article ? imageMap[article] : null;
    const imgUrl = media?.thumb || media?.img || 'images/floor3.jpg';
    if (media?.thumb || media?.img) withImg += 1;
    const size = guessSizeMm(article, name);

    brandCounts.set(brandSlug, (brandCounts.get(brandSlug) || 0) + 1);

    imported.push({
      id: stableId('prod', sku),
      name: name.startsWith('Керамогранит') ? name : `Керамогранит ${name}`,
      slug,
      sku,
      description: media?.page
        ? `${name}. Цена розничная Архангельск / Северодвинск. Фото: primavera-opt.ru`
        : `${name}. Цена розничная Архангельск / Северодвинск.`,
      price,
      oldPrice: null,
      discountPercent: null,
      unit: 'м²',
      packQty: null,
      packArea: null,
      thickness: 9,
      wearClass: null,
      length: size.length,
      width: size.width,
      color: null,
      bevel: null,
      lockType: null,
      moistureResistant: true,
      underfloorHeating: true,
      wearLayer: null,
      seoTitle: null,
      seoDescription: null,
      published: true,
      featured: index < 6,
      sortOrder: index,
      categoryId: category.id,
      brandId: brand.id,
      collectionId: collection.id,
      createdAt: now,
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
          alt: name,
          isPrimary: true,
          sortOrder: 0,
          storageKey: null,
        },
      ],
      characteristics: [
        ...(article
          ? [{ key: 'article', label: 'Артикул', value: article, sortOrder: 0 }]
          : []),
        ...(size.length && size.width
          ? [
              {
                key: 'format',
                label: 'Формат',
                value: `${size.width / 10}×${size.length / 10} см`,
                sortOrder: 1,
              },
            ]
          : []),
      ],
      stocks: [],
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

  const featuredKeep = (home.featured || []).filter((p) => p.category?.slug !== 'porcelain');
  home.featured = [...imported.slice(0, 4), ...featuredKeep].slice(0, 12);
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
        withImages: withImg,
        withoutImages: imported.length - withImg,
        keptOther: keep.length,
        sample: imported.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.price,
          unit: p.unit,
          img: p.images[0].url.slice(0, 80),
        })),
      },
      null,
      2,
    ),
  );
}

main();
