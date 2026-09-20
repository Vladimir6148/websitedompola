import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'alta-source.json'), 'utf8'));
const dataDir = path.join(root, 'apps/web/public/data');
const imgDir = path.join(root, 'apps/web/public/images/alta');
const DOWNLOAD = process.env.ALTA_DOWNLOAD_IMAGES !== '0';

fs.mkdirSync(imgDir, { recursive: true });

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

function extFromUrl(url) {
  const m = String(url).toLowerCase().match(/\.(webp|jpe?g|png)(?:\?|$)/);
  return m ? m[1].replace('jpeg', 'jpg') : 'jpg';
}

async function download(url, dest) {
  if (!url) return false;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 800) return true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'DomPolaImporter/1.0', Accept: 'image/*,*/*' },
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return buf.length > 800;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main() {
  const existingProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  const existingCategories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
  const existingBrands = JSON.parse(fs.readFileSync(path.join(dataDir, 'brands.json'), 'utf8'));
  const existingCollections = fs.existsSync(path.join(dataDir, 'collections.json'))
    ? JSON.parse(fs.readFileSync(path.join(dataDir, 'collections.json'), 'utf8'))
    : [];

  const catBySlug = new Map(existingCategories.map((c) => [c.slug, c]));
  const category = catBySlug.get('quartzvinyl-spc');
  if (!category) throw new Error('Category quartzvinyl-spc missing');

  const brandId = stableId('brand', 'alta-step');
  const brand = {
    id: brandId,
    name: 'Alta Step',
    slug: 'alta-step',
    logo: null,
    description: 'Каменно-полимерные SPC покрытия Alta Step',
    website: 'https://alta-step.ru/',
    sortOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { products: 0 },
  };

  const collections = new Map();
  const builtMeta = [];
  console.log(`Importing ${source.products.length} Alta Step products`);

  for (const [index, p] of source.products.entries()) {
    const collName = p.collection || 'Alta Step';
    const collSlug = slugify(collName);
    const collKey = `${brandId}:${collSlug}`;
    if (!collections.has(collKey)) {
      collections.set(collKey, {
        id: stableId('coll', collKey),
        name: collName,
        slug: collSlug,
        brandId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    const collection = collections.get(collKey);
    const primaryRemote = p.images?.[0];
    const ext = extFromUrl(primaryRemote || '');
    const fileName = `${p.slug || p.sku}.${ext}`;
    builtMeta.push({ index, p, collection, collName, primaryRemote, ext, fileName });
  }

  let downloaded = 0;
  let remoteOnly = 0;

  const imageResults = await mapPool(builtMeta, 6, async (item) => {
    const { primaryRemote, fileName } = item;
    const localRel = `images/alta/${fileName}`;
    const localAbs = path.join(imgDir, fileName);
    let imageUrl = primaryRemote || 'images/floor1.jpg';
    if (DOWNLOAD && primaryRemote) {
      const ok = await download(primaryRemote, localAbs);
      if (ok) {
        downloaded += 1;
        imageUrl = localRel;
      } else {
        remoteOnly += 1;
      }
    } else if (primaryRemote) {
      remoteOnly += 1;
    }
    process.stdout.write(`img ${downloaded + remoteOnly}/${builtMeta.length}\r`);
    return imageUrl;
  });

  const built = [];
  for (const [index, item] of builtMeta.entries()) {
    const { p, collection, collName } = item;
    const imageUrl = imageResults[index];
    const sku = `ALTA-${p.sku || p.slug}`;
    const slug = slugify(`alta-step-${p.name}-${p.sku || p.slug}`) || `alta-${p.slug}`;
    const id = stableId('prod', sku);

    const images = (p.images || []).slice(0, 4).map((url, i) => ({
      id: stableId('img', `${sku}-${i}`),
      productId: id,
      url: i === 0 ? imageUrl : url,
      alt: p.name,
      isPrimary: i === 0,
      sortOrder: i,
      storageKey: null,
      createdAt: new Date().toISOString(),
    }));

    built.push({
      id,
      name: `Alta Step ${p.name}`,
      slug,
      sku,
      description: p.description || p.name,
      price: 0,
      oldPrice: null,
      discountPercent: null,
      unit: 'м²',
      packQty: null,
      packArea: p.packArea || null,
      thickness: p.thickness || null,
      wearClass: '43',
      length: p.length || null,
      width: p.width || null,
      color: p.imitation || null,
      bevel: null,
      lockType: 'Замковый',
      moistureResistant: true,
      underfloorHeating: true,
      wearLayer: p.wearLayer || null,
      seoTitle: `Alta Step ${p.name} — ДОМПОЛА`,
      seoDescription: `${p.name}, коллекция ${collName}`,
      published: true,
      featured: index < 4,
      sortOrder: 1000 + index,
      categoryId: category.id,
      brandId,
      collectionId: collection.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        active: category.active,
        filterSchema: category.filterSchema,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        description: brand.description,
        website: brand.website,
        sortOrder: brand.sortOrder,
        active: brand.active,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        brandId: collection.brandId,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
      images,
      characteristics: [
        { id: stableId('ch', `${sku}-brand`), productId: id, key: 'brand', label: 'Бренд', value: 'Alta Step', sortOrder: 0 },
        { id: stableId('ch', `${sku}-coll`), productId: id, key: 'collection', label: 'Коллекция', value: collName, sortOrder: 1 },
        ...(p.sku
          ? [{ id: stableId('ch', `${sku}-art`), productId: id, key: 'sku', label: 'Артикул', value: String(p.sku), sortOrder: 2 }]
          : []),
        ...(p.thickness
          ? [{ id: stableId('ch', `${sku}-th`), productId: id, key: 'thickness', label: 'Толщина', value: `${p.thickness} мм`, sortOrder: 3 }]
          : []),
        ...(p.wearLayer
          ? [{ id: stableId('ch', `${sku}-wl`), productId: id, key: 'wearLayer', label: 'Защитный слой', value: String(p.wearLayer), sortOrder: 4 }]
          : []),
      ],
      stocks: [],
    });
  }

  brand._count.products = built.length;

  const kept = existingProducts.filter(
    (p) => p.brand?.slug !== 'alta-step' && !String(p.sku || '').startsWith('ALTA-'),
  );
  const mergedProducts = [...built, ...kept];

  const brandsOut = [brand, ...existingBrands.filter((b) => b.slug !== 'alta-step')];
  const collectionsOut = [
    ...collections.values(),
    ...existingCollections.filter((c) => c.brandId !== brandId && !String(c.id || '').includes('alta')),
  ];

  const countByCat = {};
  for (const p of mergedProducts) {
    countByCat[p.categoryId] = (countByCat[p.categoryId] || 0) + 1;
  }
  const catsOut = existingCategories.map((c) => ({
    ...c,
    _count: { products: countByCat[c.id] || 0 },
  }));

  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(mergedProducts, null, 2));
  fs.writeFileSync(path.join(dataDir, 'brands.json'), JSON.stringify(brandsOut, null, 2));
  fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(catsOut, null, 2));
  fs.writeFileSync(path.join(dataDir, 'collections.json'), JSON.stringify(collectionsOut, null, 2));

  try {
    const home = JSON.parse(fs.readFileSync(path.join(dataDir, 'home.json'), 'utf8'));
    const featured = [...built.slice(0, 4), ...(home.featured || []).filter((p) => p.brand?.slug !== 'alta-step')].slice(0, 12);
    home.featured = featured;
    home.categories = catsOut;
    fs.writeFileSync(path.join(dataDir, 'home.json'), JSON.stringify(home, null, 2));
  } catch (err) {
    console.warn('home.json update skipped', err.message);
  }

  console.log(`\nDone: ${built.length} Alta Step products, ${collections.size} collections`);
  console.log(`Images downloaded: ${downloaded}, remote fallback: ${remoteOnly}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
