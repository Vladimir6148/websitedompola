import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'pergo-source.json'), 'utf8'));
const dataDir = path.join(root, 'apps/web/public/data');
const imgDir = path.join(root, 'apps/web/public/images/pergo');
const API = process.env.DOMPOLA_API || 'https://dompola-api.onrender.com';
const DOWNLOAD = process.env.PERGO_DOWNLOAD_IMAGES !== '0';

fs.mkdirSync(imgDir, { recursive: true });

function slugify(input) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ö: 'o', ä: 'a', ü: 'u',
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

function decodeSlug(slug = '') {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function parseSpecs(text = '') {
  const t = String(text);
  const num = (re) => {
    const m = t.match(re);
    return m ? Number(String(m[1]).replace(',', '.')) : null;
  };
  return {
    thickness: num(/Толщина:\s*([\d.,]+)/i) ?? num(/Толщина\s*[—\-–:]\s*([\d.,]+)/i),
    length: num(/Длина:\s*([\d.,]+)/i),
    width: num(/Ширина:\s*([\d.,]+)/i),
    packArea: num(/Кол-?\s*во в упаковке:\s*([\d.,]+)\s*м/i) ?? num(/([\d.,]+)\s*м²/i),
    packQty: num(/\((\d+)\s*план/i),
    wearClass: (t.match(/Класс эксплуатации:\s*([^\n.<]+)/i)?.[1] || t.match(/(\d+)\s*класс/i)?.[1] || '').trim() || null,
    bevel: (t.match(/Фаска:\s*([^\n.<]+)/i)?.[1] || '').replace(/<\/?[^>]+>/g, '').trim() || null,
    lockType: /uniclic/i.test(t) ? 'Uniclic' : null,
  };
}

function pickCollection(product, catById) {
  const cats = product.categories || [];
  const leaf = cats.find((c) => {
    const full = catById.get(c.id);
    return full && full.parent && full.parent !== 0 && full.slug !== 'arhiv';
  });
  if (leaf) return { name: leaf.name, slug: slugify(decodeSlug(leaf.slug) || leaf.name) };
  return null;
}

function mapCategorySlug(product) {
  const slugs = (product.categories || []).map((c) => decodeSlug(c.slug));
  if (slugs.includes('arhiv')) return null;
  if (slugs.includes('podlozhka-pergo') || slugs.some((s) => s.includes('podlozhka'))) return 'underlayment';
  if (slugs.includes('plintus-dlya-laminata') || slugs.some((s) => s.includes('plintus'))) return 'baseboards';
  if (slugs.includes('perehodnik-5-v-1') || slugs.includes('firmennye-aksessuary')) return 'accessories';
  if (slugs.includes('vinil') || slugs.some((s) => /pad-pro|namsen|viskan|vorma|glomma|isefjord/i.test(s))) {
    return 'quartzvinyl-spc';
  }
  if (slugs.includes('laminat') || slugs.some((s) => /pro|kalmar|chevron|ebeltoft|elements|skara|uppsala|stavanger|goteborg|malmo/i.test(s))) {
    return 'laminate';
  }
  return 'laminate';
}

async function download(url, dest) {
  if (!url) return false;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 800) return true;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'DomPolaImporter/1.0' },
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

function extFromUrl(url) {
  const m = String(url).toLowerCase().match(/\.(webp|jpe?g|png)(?:\?|$)/);
  return m ? m[1].replace('jpeg', 'jpg') : 'jpg';
}

function stableId(prefix, key) {
  const h = createHash('sha1').update(String(key)).digest('hex').slice(0, 16);
  return `${prefix}_${h}`;
}

async function api(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`${method} ${pathname} ${res.status}: ${text.slice(0, 250)}`);
  return json;
}

async function main() {
  const catById = new Map(source.categories.map((c) => [c.id, c]));
  const existingProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  const existingCategories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
  const existingBrands = JSON.parse(fs.readFileSync(path.join(dataDir, 'brands.json'), 'utf8'));

  const brandId = stableId('brand', 'pergo');
  const brand = {
    id: brandId,
    name: 'Pergo',
    slug: 'pergo',
    logo: null,
    description: 'Влагостойкий ламинат и винил Pergo',
    website: 'https://pergo-floor.ru/',
    sortOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { products: 0 },
  };

  const catBySlug = new Map(existingCategories.map((c) => [c.slug, c]));
  const collections = new Map();

  const filtered = source.products.filter((p) => {
    const slugs = (p.categories || []).map((c) => decodeSlug(c.slug));
    return !slugs.includes('arhiv');
  });

  console.log(`Importing ${filtered.length} of ${source.products.length} (skip archive)`);

  const built = [];
  let downloaded = 0;
  let remoteOnly = 0;

  for (const [index, p] of filtered.entries()) {
    const categorySlug = mapCategorySlug(p);
    if (!categorySlug) continue;
    const category = catBySlug.get(categorySlug);
    if (!category) {
      console.warn('Missing category', categorySlug, p.name);
      continue;
    }

    const collMeta = pickCollection(p, catById);
    let collection = null;
    if (collMeta) {
      const key = `${brandId}:${collMeta.slug}`;
      if (!collections.has(key)) {
        collections.set(key, {
          id: stableId('coll', key),
          name: collMeta.name,
          slug: collMeta.slug,
          brandId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      collection = collections.get(key);
    }

    const primaryRemote = p.images?.[0]?.src;
    const ext = extFromUrl(primaryRemote || '');
    const fileName = `${p.id}.${ext}`;
    const localRel = `images/pergo/${fileName}`;
    const localAbs = path.join(imgDir, fileName);
    let imageUrl = primaryRemote || 'images/floor1.jpg';

    if (DOWNLOAD && primaryRemote) {
      process.stdout.write(`img ${index + 1}/${filtered.length}\r`);
      const ok = await download(primaryRemote, localAbs);
      if (ok) {
        imageUrl = localRel;
        downloaded += 1;
      } else {
        remoteOnly += 1;
      }
    } else if (primaryRemote) {
      remoteOnly += 1;
    }

    const specs = parseSpecs(`${p.short_description}\n${p.description}`);
    const sku = `PERGO-${p.sku || p.id}`.replace(/\s+/g, '');
    const slug = slugify(p.name) || `pergo-${p.id}`;
    const id = stableId('prod', sku);

    const images = (p.images || []).slice(0, 4).map((img, i) => ({
      id: stableId('img', `${p.id}-${i}`),
      productId: id,
      url: i === 0 ? imageUrl : img.src,
      alt: img.alt || p.name,
      isPrimary: i === 0,
      sortOrder: i,
      storageKey: null,
      createdAt: new Date().toISOString(),
    }));

    built.push({
      id,
      name: p.name,
      slug,
      sku,
      description: [p.description, p.short_description].filter(Boolean).join('\n\n'),
      price: 0,
      oldPrice: null,
      discountPercent: null,
      unit: 'м²',
      packQty: specs.packQty,
      packArea: specs.packArea,
      thickness: specs.thickness,
      wearClass: specs.wearClass,
      length: specs.length,
      width: specs.width,
      color: null,
      bevel: specs.bevel,
      lockType: specs.lockType,
      moistureResistant: true,
      underfloorHeating: true,
      wearLayer: null,
      seoTitle: `${p.name} — ДОМПОЛА`,
      seoDescription: p.description?.slice(0, 160) || p.name,
      published: true,
      featured: index < 6,
      sortOrder: index,
      categoryId: category.id,
      brandId,
      collectionId: collection?.id || null,
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
      collection: collection
        ? {
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            brandId: collection.brandId,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
          }
        : null,
      images,
      characteristics: [
        { id: stableId('ch', `${sku}-brand`), productId: id, key: 'brand', label: 'Бренд', value: 'Pergo', sortOrder: 0 },
        ...(collection
          ? [{ id: stableId('ch', `${sku}-coll`), productId: id, key: 'collection', label: 'Коллекция', value: collection.name, sortOrder: 1 }]
          : []),
        ...(specs.thickness
          ? [{ id: stableId('ch', `${sku}-th`), productId: id, key: 'thickness', label: 'Толщина', value: `${specs.thickness} мм`, sortOrder: 2 }]
          : []),
        ...(specs.wearClass
          ? [{ id: stableId('ch', `${sku}-wc`), productId: id, key: 'wearClass', label: 'Класс', value: String(specs.wearClass), sortOrder: 3 }]
          : []),
      ],
      stocks: [],
    });
  }

  brand._count.products = built.length;

  // Keep non-Pergo products, replace previous Pergo imports
  const kept = existingProducts.filter((p) => p.brand?.slug !== 'pergo' && !String(p.sku || '').startsWith('PERGO-'));
  const mergedProducts = [...built, ...kept];

  const brandsOut = [
    brand,
    ...existingBrands.filter((b) => b.slug !== 'pergo'),
  ];

  // Update category counts
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
  fs.writeFileSync(
    path.join(dataDir, 'collections.json'),
    JSON.stringify([...collections.values()], null, 2),
  );

  // Refresh home featured with a few Pergo items
  try {
    const home = JSON.parse(fs.readFileSync(path.join(dataDir, 'home.json'), 'utf8'));
    home.featured = built.slice(0, 8);
    home.categories = catsOut;
    fs.writeFileSync(path.join(dataDir, 'home.json'), JSON.stringify(home, null, 2));
  } catch (err) {
    console.warn('home.json update skipped', err.message);
  }

  console.log(`\nStatic catalog ready: ${built.length} Pergo products, ${collections.size} collections`);
  console.log(`Images downloaded: ${downloaded}, remote fallback: ${remoteOnly}`);

  // Optional live API sync
  if (process.env.PERGO_SYNC_API === '1') {
    console.log(`Syncing to API ${API}...`);
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@dompola.ru', password: 'admin123' },
    });
    const token = login.token;
    let brands = await api('/api/brands?all=1', { token });
    let apiBrand = brands.find((b) => b.slug === 'pergo');
    if (!apiBrand) {
      apiBrand = await api('/api/brands', {
        method: 'POST',
        token,
        body: {
          name: 'Pergo',
          slug: 'pergo',
          description: brand.description,
          website: brand.website,
          sortOrder: 1,
          active: true,
        },
      });
    }
    const categoriesApi = await api('/api/categories?all=1', { token });
    const collMap = new Map();
    for (const coll of collections.values()) {
      try {
        const created = await api('/api/collections', {
          method: 'POST',
          token,
          body: { name: coll.name, slug: coll.slug, brandId: apiBrand.id },
        });
        collMap.set(coll.slug, created.id);
      } catch {
        const list = await api(`/api/collections?brand=${apiBrand.id}`, { token });
        const found = (list || []).find((c) => c.slug === coll.slug);
        if (found) collMap.set(coll.slug, found.id);
      }
    }

    for (const p of built) {
      const category = categoriesApi.find((c) => c.slug === p.category.slug);
      if (!category) continue;
      const payload = {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: 0,
        unit: p.unit,
        packQty: p.packQty,
        packArea: p.packArea,
        thickness: p.thickness,
        wearClass: p.wearClass,
        length: p.length,
        width: p.width,
        bevel: p.bevel,
        lockType: p.lockType,
        moistureResistant: true,
        underfloorHeating: true,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        published: true,
        featured: p.featured,
        sortOrder: p.sortOrder,
        categoryId: category.id,
        brandId: apiBrand.id,
        collectionId: p.collection ? collMap.get(p.collection.slug) || null : null,
        images: p.images.map(({ url, alt, isPrimary, sortOrder }) => ({ url, alt, isPrimary, sortOrder })),
        characteristics: p.characteristics.map(({ key, label, value, sortOrder }) => ({ key, label, value, sortOrder })),
      };
      try {
        await api('/api/products', { method: 'POST', token, body: payload });
        console.log('API created', p.sku);
      } catch (err) {
        console.warn('API skip', p.sku, err.message);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
