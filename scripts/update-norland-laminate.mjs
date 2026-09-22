/**
 * Apply Norland laminate pack dims + ₽/м² from 1C cards.
 * packArea always rounded to 3 decimal places.
 * Price stored as ₽/м²; pack = price × packArea.
 *
 * Usage: node scripts/update-norland-laminate.mjs
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

function articleCode(p) {
  const fromSku = String(p.sku || '').match(/LF\d{3}/i)?.[0];
  if (fromSku) return fromSku.toUpperCase();
  const fromName = String(p.name || '').match(/LF\d{3}/i)?.[0];
  return fromName ? fromName.toUpperCase() : '';
}

const COLLECTIONS = [
  {
    id: 'elegant',
    codes: ['LF301'],
    length: 1220,
    width: 198,
    packQty: 10,
    pricePerM2: 1930,
    thickness: 8,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'elegant-10',
    codes: ['LF305'],
    length: 1220,
    width: 198,
    packQty: 8,
    pricePerM2: 2160,
    thickness: 10,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'elegant-strong',
    codes: ['LF302'],
    length: 1220,
    width: 198,
    packQty: 7,
    pricePerM2: 2630,
    thickness: 12,
    wearClass: '34',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'herringbone-elegant',
    codes: ['LF303'],
    length: 600,
    width: 100,
    packQty: 32,
    pricePerM2: 2490,
    thickness: 8,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'herringbone-elegant-10',
    codes: ['LF306'],
    length: 600,
    width: 100,
    packQty: 26,
    pricePerM2: 2610,
    thickness: 10,
    wearClass: '33',
    lockType: 'Угловой',
    bevel: '4V',
    wax: 'Есть',
  },
  {
    id: 'herringbone-elegant-strong',
    codes: ['LF304'],
    length: 600,
    width: 100,
    packQty: 22,
    pricePerM2: 2790,
    thickness: 12,
    wearClass: '34',
    lockType: 'Угловой',
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
    const code = articleCode(p);
    if (!col.codes.includes(code)) continue;

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
  summary.push({ id: col.id, codes: col.codes, n, packArea: area, pricePerM2: col.pricePerM2, packPrice });
}

fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
console.log('total updated', summary.reduce((s, r) => s + r.n, 0));
