import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'mspc-source.json'), 'utf8'));
const API = process.env.DOMPOLA_API || 'https://dompola-api.onrender.com';
const imgDir = path.join(root, 'apps/web/public/images/mspc');
const GH_IMG = 'https://vladimir6148.github.io/websitedompola/images/mspc';

fs.mkdirSync(imgDir, { recursive: true });

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
    .slice(0, 80);
}

function parseSpecs(text) {
  const plain = stripHtml(text);
  const num = (re) => {
    const m = plain.match(re);
    return m ? Number(String(m[1]).replace(',', '.')) : null;
  };
  const size = plain.match(/Размер доски\s*[—\-–]\s*(\d+)\s*[xх×]\s*(\d+)/i);
  return {
    thickness: num(/Толщина\s*[—\-–]\s*([\d.,]+)/i) ?? 8,
    wearClass: (plain.match(/Класс истираемости\s*[—\-–]\s*([^\n•]+)/i)?.[1] || '33').trim(),
    packArea: num(/Упаковка[^\n]*?=\s*([\d.,]+)\s*м/i),
    packQty: num(/Упаковка\s*[—\-–]\s*(\d+)\s*досок/i),
    length: size ? Number(size[1]) : null,
    width: size ? Number(size[2]) : null,
    bevel: (plain.match(/Фаска\s*[—\-–]\s*([^\n•]+)/i)?.[1] || '4-сторонняя').trim(),
    lockType: 'Uniclic',
    moistureResistant: true,
    underfloorHeating: true,
  };
}

function colorFromTitle(title) {
  return title.replace(/^Ламинат MSPC\s+/i, '').trim();
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
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
  if (!res.ok) {
    throw new Error(`${method} ${pathname} ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

async function main() {
  console.log(`Importing ${source.products.length} MSPC products into ${API}`);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@dompola.ru', password: 'admin123' },
  });
  const token = login.token;
  console.log('Authenticated');

  let categories = await api('/api/categories?all=1', { token });
  let mspc = categories.find((c) => c.slug === 'mspc');
  if (!mspc) {
    mspc = await api('/api/categories', {
      method: 'POST',
      token,
      body: {
        name: 'MSPC',
        slug: 'mspc',
        description:
          'Минерально-каменный (MSPC) ламинат Stone Floor: водостойкий, термостойкий, без ПВХ, замок Uniclic, 8 мм.',
        image: 'images/mspc/category.jpg',
        sortOrder: 0,
        active: true,
        filterSchema: JSON.stringify([
          'brand', 'collection', 'price', 'thickness', 'wearClass', 'color',
          'bevel', 'moistureResistant', 'underfloorHeating', 'lockType',
        ]),
      },
    });
    console.log('Created category MSPC', mspc.id);
  } else {
    console.log('Category MSPC exists', mspc.id);
  }

  let brands = await api('/api/brands?all=1', { token });
  let brand = brands.find((b) => b.slug === 'stone-floor');
  if (!brand) {
    brand = await api('/api/brands', {
      method: 'POST',
      token,
      body: {
        name: 'Stone Floor',
        slug: 'stone-floor',
        description: 'Производитель минерально-каменного MSPC ламината',
        website: 'https://stone-floor.com',
        sortOrder: 0,
        active: true,
      },
    });
    console.log('Created brand Stone Floor', brand.id);
  } else {
    console.log('Brand Stone Floor exists', brand.id);
  }

  const cities = await api('/api/content/cities');
  const existing = await api('/api/products?limit=500&all=1', { token }).catch(() =>
    api('/api/products?limit=500', { token }),
  );
  const existingList = existing.items || existing.products || existing || [];
  const bySku = new Map(existingList.map((p) => [p.sku, p]));

  const prepared = [];
  for (const [index, p] of source.products.entries()) {
    const gallery = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery || [];
    const primaryRemote = gallery[0]?.img;
    if (!primaryRemote) {
      console.warn('No image for', p.title);
      continue;
    }
    const fileName = `${p.uid}.jpg`;
    const localPath = path.join(imgDir, fileName);
    process.stdout.write(`img ${index + 1}/${source.products.length} ${fileName}\r`);
    await download(primaryRemote, localPath);

    if (index === 0) {
      fs.copyFileSync(localPath, path.join(imgDir, 'category.jpg'));
    }

    const specs = parseSpecs(p.text || '');
    const description = [p.descr, '', stripHtml(p.text || '')].filter(Boolean).join('\n\n');
    const sku = `SF-MSPC-${p.uid}`;
    const slug = slugify(p.title) || `mspc-${p.uid}`;
    const images = gallery.slice(0, 4).map((g, i) => ({
      url: i === 0 ? `images/mspc/${fileName}` : g.img,
      alt: p.title,
      isPrimary: i === 0,
      sortOrder: i,
    }));

    const payload = {
      name: p.title,
      slug,
      sku,
      description,
      price: Number(p.price),
      unit: 'м²',
      packArea: specs.packArea,
      packQty: specs.packQty,
      thickness: specs.thickness,
      wearClass: specs.wearClass,
      length: specs.length,
      width: specs.width,
      color: colorFromTitle(p.title),
      bevel: specs.bevel,
      lockType: specs.lockType,
      moistureResistant: true,
      underfloorHeating: true,
      seoTitle: `${p.title} — ДОМПОЛА`,
      seoDescription: p.descr || p.title,
      published: true,
      featured: index < 4,
      sortOrder: index,
      categoryId: mspc.id,
      brandId: brand.id,
      images,
      characteristics: [
        { key: 'type', label: 'Тип', value: 'MSPC (минерально-каменный ламинат)' },
        { key: 'brand', label: 'Бренд', value: 'Stone Floor' },
        { key: 'thickness', label: 'Толщина', value: `${specs.thickness} мм` },
        { key: 'wearClass', label: 'Класс истираемости', value: String(specs.wearClass) },
        { key: 'lock', label: 'Замок', value: 'Uniclic' },
        { key: 'water', label: 'Водостойкость', value: '100%' },
        { key: 'heating', label: 'Тёплый пол', value: 'Без ограничений (до +70°C)' },
        { key: 'pvc', label: 'ПВХ', value: '0%' },
        { key: 'warranty', label: 'Гарантия', value: '30 лет' },
        ...(p.sku ? [{ key: 'vendorSku', label: 'Артикул производителя', value: p.sku }] : []),
      ],
      stocks: cities.map((c) => ({
        cityId: c.id,
        status: 'IN_STOCK',
        quantity: 50,
      })),
    };

    prepared.push({ payload, uid: p.uid, remote: primaryRemote });

    if (bySku.has(sku)) {
      console.log(`skip existing ${sku}`);
      continue;
    }

    try {
      await api('/api/products', { method: 'POST', token, body: payload });
      console.log(`created ${payload.name}`);
    } catch (err) {
      console.error(`FAIL ${payload.name}:`, err.message);
    }
  }

  // Refresh static JSON snapshots from API public endpoints where possible
  const [cats, brandsOut, productsOut, home] = await Promise.all([
    api('/api/categories'),
    api('/api/brands'),
    api('/api/products?limit=500'),
    api('/api/content/home'),
  ]);

  const dataDir = path.join(root, 'apps/web/public/data');
  const productItems = productsOut.items || productsOut;
  fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(cats, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'brands.json'), JSON.stringify(brandsOut, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(productItems, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'home.json'), JSON.stringify(home, null, 2), 'utf8');

  console.log(`\nDone. Category MSPC, brand Stone Floor, products: ${prepared.length}`);
  console.log(`Images in ${imgDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
