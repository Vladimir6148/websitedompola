import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const productsPath = path.join(root, 'apps/web/public/data/products.json');

/** Pack area from board mm + pieces */
function packAreaMm(lengthMm, widthMm, pieces) {
  return Math.round((lengthMm / 1000) * (widthMm / 1000) * pieces * 10000) / 10000;
}

/**
 * From 1C cards: L×W×pieces (3rd dim in габариты is pieces, not thickness).
 * price = ₽/м², unit м² (same model as Ideal).
 */
const COLLECTIONS = [
  {
    id: 'skara-pro',
    match: (p) => p.collection?.slug === 'skara-pro',
    length: 1380,
    width: 190,
    packQty: 6,
    pricePerM2: 2940,
    thickness: 9,
    wearClass: '33',
  },
  {
    id: 'skara-12-pro',
    match: (p) => p.collection?.slug === 'skara',
    length: 1380,
    width: 190,
    packQty: 5,
    pricePerM2: 3220,
    thickness: 12,
    wearClass: '33',
  },
  {
    id: 'goteborg-pro',
    match: (p) => /Goteborg|Goeteborg/i.test(p.name || ''),
    length: 1200,
    width: 190,
    packQty: 7,
    pricePerM2: 2180,
    thickness: 8,
    wearClass: '33',
  },
  {
    id: 'kalmar',
    match: (p) => p.brand?.slug === 'kalmar' || /Kalmar/i.test(p.name || ''),
    length: 1380,
    width: 190,
    packQty: 7,
    pricePerM2: 1830,
    thickness: 8,
    wearClass: '32',
  },
  {
    id: 'chevron-12-pro',
    match: (p) => /Chevron\s*12/i.test(p.name || ''),
    length: 1200,
    width: 396,
    packQty: 3,
    pricePerM2: 3360,
    thickness: 12,
    wearClass: '33',
  },
  {
    id: 'elements-12-pro',
    match: (p) => p.brand?.slug === 'elements' || /Elements/i.test(p.name || ''),
    length: 1200,
    width: 396,
    packQty: 3,
    pricePerM2: 3360,
    thickness: 12,
    wearClass: '33',
  },
  {
    id: 'uppsala-pro',
    match: (p) => p.collection?.slug === 'uppsala-pro' || /Uppsala/i.test(p.name || ''),
    length: 1200,
    width: 190,
    packQty: 7,
    pricePerM2: 2630,
    thickness: 8,
    wearClass: '33',
  },
  {
    id: 'ebeltoft-12-pro',
    match: (p) => p.brand?.slug === 'ebeltoft' || /Ebeltoft/i.test(p.name || ''),
    length: 1200,
    width: 396,
    packQty: 3,
    pricePerM2: 3360,
    thickness: 12,
    wearClass: '33',
  },
  {
    id: 'malmo-pro',
    match: (p) => p.collection?.slug === 'malmo-pro' || /Malmo/i.test(p.name || ''),
    length: 1380,
    width: 156,
    packQty: 8,
    pricePerM2: 2240,
    thickness: 8,
    wearClass: '33',
  },
];

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const now = new Date().toISOString();
const summary = [];

for (const col of COLLECTIONS) {
  const area = packAreaMm(col.length, col.width, col.packQty);
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
    if (col.thickness != null) p.thickness = col.thickness;
    if (col.wearClass) p.wearClass = col.wearClass;
    p.updatedAt = now;
    n += 1;
  }
  summary.push({
    id: col.id,
    n,
    length: col.length,
    width: col.width,
    packQty: col.packQty,
    packArea: area,
    pricePerM2: col.pricePerM2,
    packPrice,
  });
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
