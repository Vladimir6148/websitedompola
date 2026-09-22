/**
 * Apply Amadei laminate collection pack dims + ₽/м² from 1C cards.
 * packArea always rounded to 3 decimal places.
 *
 * Usage: node scripts/update-amadei-laminate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const productsPath = path.join(root, 'apps/web/public/data/products.json');

function packArea3(lengthMm, widthMm, pieces) {
  const raw = (lengthMm / 1000) * (widthMm / 1000) * pieces;
  return Math.round(raw * 1000) / 1000;
}

function upsertChar(list, key, label, value) {
  const arr = Array.isArray(list) ? [...list] : [];
  const i = arr.findIndex((c) => c.key === key || c.label === label);
  const row = { key, label, value, sortOrder: i >= 0 ? arr[i].sortOrder : arr.length };
  if (i >= 0) arr[i] = { ...arr[i], ...row };
  else arr.push(row);
  return arr;
}

/**
 * Single-collection rules (brand slug match).
 * For kastanety / svirel — article prefix matchers below.
 */
const COLLECTIONS = [
  {
    id: 'arfa-12-33',
    match: (p) => p.brand?.slug === 'arfa',
    length: 1292,
    width: 194,
    packQty: 5,
    pricePerM2: 2510,
    thickness: 12,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'valtorna-12-33',
    match: (p) => p.brand?.slug === 'valtorna',
    length: 1292,
    width: 116,
    packQty: 5,
    pricePerM2: 2510,
    thickness: 12,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Нет',
  },
  {
    id: 'vargan',
    match: (p) => p.brand?.slug === 'vargan',
    length: 600,
    width: 100,
    packQty: 32,
    pricePerM2: 2400,
    thickness: 12,
    wearClass: '34',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'gelikon-10-32',
    match: (p) => p.brand?.slug === 'gelikon',
    length: 1292,
    width: 194,
    packQty: 6,
    pricePerM2: 1860,
    thickness: 10,
    wearClass: '32',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'domra',
    match: (p) => p.brand?.slug === 'domra',
    length: 600,
    width: 100,
    packQty: 26,
    pricePerM2: 2350,
    thickness: 10,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'lira-8-33',
    match: (p) => p.brand?.slug === 'lira',
    length: 1292,
    width: 194,
    packQty: 8,
    pricePerM2: 2040,
    thickness: 8,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'lyuten-9-33',
    match: (p) => p.brand?.slug === 'lyuten',
    length: 1292,
    width: 194,
    packQty: 7,
    pricePerM2: 2320,
    thickness: 9,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'melodika-8-32',
    match: (p) => p.brand?.slug === 'melodika',
    length: 1292,
    width: 194,
    packQty: 8,
    pricePerM2: 1750,
    thickness: 8,
    wearClass: '32',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'fanfara-8-32',
    match: (p) => p.brand?.slug === 'fanfara',
    length: 1292,
    width: 194,
    packQty: 8,
    pricePerM2: 1430,
    thickness: 8,
    wearClass: '32',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'tsitra-10-33',
    match: (p) => p.brand?.slug === 'tsitra',
    length: 1292,
    width: 159,
    packQty: 6,
    pricePerM2: 2430,
    thickness: 10,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  // Кастаньеты — по артикулам 4001–4020
  {
    id: 'kastanety-8-32',
    match: (p) => {
      const n = Number(String(p.name).match(/Кастаньеты\s+(\d+)/i)?.[1]);
      return p.brand?.slug === 'kastanety' && n >= 4001 && n <= 4005;
    },
    length: 1380,
    width: 195,
    packQty: 8,
    pricePerM2: 1380,
    thickness: 8,
    wearClass: '32',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'kastanety-8-33',
    match: (p) => {
      const n = Number(String(p.name).match(/Кастаньеты\s+(\d+)/i)?.[1]);
      return p.brand?.slug === 'kastanety' && n >= 4006 && n <= 4009;
    },
    length: 1380,
    width: 195,
    packQty: 8,
    pricePerM2: 1480,
    thickness: 8,
    wearClass: '33',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'kastanety-10-33',
    match: (p) => {
      const n = Number(String(p.name).match(/Кастаньеты\s+(\d+)/i)?.[1]);
      return p.brand?.slug === 'kastanety' && n >= 4010 && n <= 4015;
    },
    length: 1380,
    width: 193,
    packQty: 8,
    pricePerM2: 1670,
    thickness: 10,
    wearClass: '33',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'kastanety-12-33',
    match: (p) => {
      const n = Number(String(p.name).match(/Кастаньеты\s+(\d+)/i)?.[1]);
      return p.brand?.slug === 'kastanety' && n >= 4016 && n <= 4020;
    },
    length: 1380,
    width: 159,
    packQty: 8,
    pricePerM2: 1770,
    thickness: 12,
    wearClass: '33',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
  // Свирель — по сериям артикулов
  {
    id: 'svirel-8-33',
    match: (p) => p.brand?.slug === 'svirel' && /\b420\d{2}\b/.test(p.name + p.sku),
    length: 1292,
    width: 193,
    packQty: 8,
    pricePerM2: 1300,
    thickness: 8,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'svirel-10-33',
    match: (p) => p.brand?.slug === 'svirel' && /\b421\d{2}\b/.test(p.name + p.sku),
    length: 1292,
    width: 193,
    packQty: 7,
    pricePerM2: 1550,
    thickness: 10,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'svirel-12-33',
    match: (p) => p.brand?.slug === 'svirel' && /\b422\d{2}\b/.test(p.name + p.sku),
    length: 1292,
    width: 193,
    packQty: 6,
    pricePerM2: 1720,
    thickness: 12,
    wearClass: '33',
    lockType: 'Универсальный',
    bevel: '4V',
    wax: 'Есть',
  },
];

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const now = new Date().toISOString();
const summary = [];

for (const col of COLLECTIONS) {
  const area = packArea3(col.length, col.width, col.packQty);
  const packPrice = Math.round(col.pricePerM2 * area * 100) / 100;
  let n = 0;
  for (const p of products) {
    if (p.category?.slug !== 'laminate') continue;
    if (!col.match(p)) continue;

    p.price = col.pricePerM2;
    p.unit = 'м²';
    p.packArea = area;
    p.packQty = col.packQty;
    p.length = col.length;
    p.width = col.width;
    p.thickness = col.thickness;
    p.wearClass = col.wearClass;
    p.lockType = col.lockType;
    p.bevel = col.bevel;
    p.updatedAt = now;

    let chars = p.characteristics || [];
    chars = upsertChar(chars, 'wear_class', 'Класс', col.wearClass);
    chars = upsertChar(chars, 'thickness', 'Толщина', `${col.thickness} мм`);
    chars = upsertChar(chars, 'lock', 'Тип замка', col.lockType);
    chars = upsertChar(chars, 'bevel', 'Фаска', col.bevel);
    chars = upsertChar(chars, 'wax', 'Обработка воском', col.wax);
    chars = upsertChar(chars, 'pack_qty', 'Штук в упаковке', String(col.packQty));
    chars = upsertChar(chars, 'pack_area', 'Площадь упаковки', `${area} м²`);
    chars = upsertChar(chars, 'board_size', 'Размер доски', `${col.length}×${col.width} мм`);
    chars = upsertChar(chars, 'price_basis', 'Цена', 'за м²');
    p.characteristics = chars;
    n += 1;
  }
  summary.push({ id: col.id, n, packArea: area, pricePerM2: col.pricePerM2, packPrice });
}

fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
console.log('total updated', summary.reduce((s, r) => s + r.n, 0));
