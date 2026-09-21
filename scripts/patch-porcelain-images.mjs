import fs from 'node:fs';

const path = 'C:/Users/Admin/websitedompola/apps/web/public/data/products.json';
const products = JSON.parse(fs.readFileSync(path, 'utf8'));

const byCode = {
  TP66M03: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M03_8%201-min-445x445.jpg',
  TP66M07: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M07_10%201-min-445x445.jpg',
  TP66M09: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M09_7%201-min-445x445.jpg',
  TP66M10: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M10_6%201-min-445x445.jpg',
  TP66M11: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M11_7%201-min-445x445.jpg',
  TP66M13: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M13_7%201-min-445x445.jpg',
  TP66M16: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M16_8%201-min-445x445.jpg',
  TP66M17: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M17_7%201-min-445x445.jpg',
  TP66M18: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M18_7%201-min-445x445.jpg',
  TP66M20: 'https://primavera-opt.ru/image/cache/catalog/Primavera%20new%20photos/TP66M20_7%201-min-445x445.jpg',
};

let fixed = 0;
for (const p of products) {
  if (p.category?.slug !== 'porcelain') continue;
  if (!p.images?.[0]?.url?.startsWith('images/')) continue;
  const raw = (p.name.match(/\(([^)]+)\)/) || [])[1] || '';
  const code = raw.toUpperCase().replace(/М/g, 'M');
  const img = byCode[code];
  if (img) {
    p.images[0].url = img;
    fixed++;
  }
}

fs.writeFileSync(path, JSON.stringify(products, null, 2));
const left = products.filter(
  (p) => p.category?.slug === 'porcelain' && p.images?.[0]?.url?.startsWith('images/'),
);
console.log({ fixed, remaining: left.length, names: left.map((p) => p.name) });
