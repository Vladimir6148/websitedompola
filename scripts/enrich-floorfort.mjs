/**
 * Enrich FloorFort products: specs from floorfort.ru cards + MirLaminata image URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'apps/web/public/data');
const productsPath = path.join(dataDir, 'products.json');
const collectionsPath = path.join(dataDir, 'collections.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

const IMAGE_BY_ARTICLE = {
  '19027-8': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19027-8/19027-8_5.jpg-800x800.jpg',
  '19031-5': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19031-5/19035-1_1-800x800.jpg',
  '19011-1': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19011-1/19011-1_1.jpg-800x800.jpg',
  '19009-20': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19009-20/19009-20-4-800x800.jpg',
  '19027-7': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19027-7/19027-7_1.jpg-800x800.jpg',
  '19009-18': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19009-18/19009-18_31.jpg-800x800.jpg',
  '19027-1': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19027-1/19027-1_1.jpg-800x800.jpg',
  '19027-9': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19027-9/19027-9_1.jpg-800x800.jpg',
  '19011-4': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19011-4/19011-4_1.jpg-800x800.jpg',
  '19009-6': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19009-6/19009-6_1.jpg-800x800.jpg',
  '19011-5': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19011-5/19011-5_31.jpg-800x800.jpg',
  '19009-4': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19009-4/19009-4_1.jpg-800x800.jpg',
  '19009-21': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19009-21/19009-21-0-800x800.jpeg',
  '19031-6': 'https://mirlaminata.com/image/cache/catalog/FloorFort/Oak%20Heritage/19031-6/19031-6-0-800x800.jpeg',
  '19004-29': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19004-29-0-800x800.jpeg',
  '19023-18': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023-18-0-800x800.jpeg',
  '19023-20': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023-20-0-800x800.jpeg',
  '19023': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023-0-800x800.jpeg',
  '19023-17': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023-17-1-800x800.jpeg',
  '19004-1': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19004-1-0-800x800.jpeg',
  '19004-1HC': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19004-1HC-0-800x800.jpeg',
  '19004-30HC': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19004-30HC-0-800x800.jpeg',
  '19023HC': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023HC-0-800x800.jpeg',
  '19023-19HC': 'https://mirlaminata.com/image/cache/catalog/FloorFort/WalnutTree/19023-19HC-0-800x800.jpeg',
};

function articleKey(name) {
  const ns = /\sНС\s*$/i.test(name);
  const m = name.match(/(\d[\w-]*)\s*(?:НС)?\s*$/i);
  if (!m) return null;
  const art = m[1];
  if (!ns) return art;
  const map = {
    '19023': '19023HC',
    '19004-1': '19004-1HC',
    '19004-30': '19004-30HC',
    '19023-19': '19023-19HC',
  };
  return map[art] || `${art}HC`;
}

function idFor(prefix, seed) {
  return `${prefix}_${createHash('md5').update(seed).digest('hex').slice(0, 16)}`;
}

for (const c of collections) {
  if (c.slug === 'floorfort-dub') c.name = 'Oak Heritage';
  if (c.slug === 'floorfort-oreh') c.name = 'Walnut Tree';
}

let updated = 0;
for (const p of products) {
  if (p.brand?.slug !== 'floorfort') continue;
  const art = articleKey(p.name);
  const remote = art ? IMAGE_BY_ARTICLE[art] : null;
  const isHc = /\sНС\s*$/i.test(p.name);

  p.length = 1220;
  p.width = 130;
  p.thickness = 10;
  p.packQty = 16;
  p.packArea = 2.537;
  p.wearClass = '33';
  p.bevel = '4V';
  p.lockType = 'Uniclic';
  p.moistureResistant = true;
  p.underfloorHeating = true;
  p.unit = 'упаковка';
  if (!isHc) p.price = 10186;

  if (p.collection?.slug === 'floorfort-dub') p.collection.name = 'Oak Heritage';
  if (p.collection?.slug === 'floorfort-oreh') p.collection.name = 'Walnut Tree';

  p.characteristics = [
    { key: 'wear_class', label: 'Класс', value: '33 (AC5)', sortOrder: 0 },
    { key: 'thickness', label: 'Толщина', value: '10 мм', sortOrder: 1 },
    { key: 'size', label: 'Размер доски', value: '1220×130 мм', sortOrder: 2 },
    { key: 'pack', label: 'Упаковка', value: '16 досок = 2,537 м²', sortOrder: 3 },
    { key: 'pack_weight', label: 'Вес упаковки', value: '20 кг', sortOrder: 4 },
    { key: 'bevel', label: 'Фаска', value: '4-сторонняя', sortOrder: 5 },
    { key: 'lock', label: 'Замок', value: 'Uniclic с воском', sortOrder: 6 },
    { key: 'price_m2', label: 'Цена за м²', value: isHc ? 'уценка / НС' : '4 015 ₽', sortOrder: 7 },
    { key: 'article', label: 'Артикул', value: art || '', sortOrder: 8 },
  ];

  if (remote) {
    p.images = [
      {
        id: idFor('img', `${p.id}-main`),
        productId: p.id,
        url: remote,
        alt: p.name,
        isPrimary: true,
        sortOrder: 0,
        storageKey: null,
        createdAt: p.createdAt,
      },
    ];
  }

  p.description = `${p.name}. Коллекция ${p.collection?.name || 'FloorFort'}: 33 класс, 10 мм, доска 1220×130 мм, упаковка 16 досок / 2,537 м². Цена за упаковку.`;
  p.updatedAt = new Date().toISOString();
  updated++;
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2));
console.log(JSON.stringify({ updated }, null, 2));
