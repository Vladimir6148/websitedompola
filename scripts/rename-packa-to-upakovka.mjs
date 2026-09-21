import fs from 'node:fs';

const files = ['apps/web/public/data/products.json', 'apps/web/public/data/home.json'];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  text = text.replace(/"unit":\s*"пачка"/g, '"unit": "упаковка"');
  text = text.replace(/за пачку \(упаковку\)/g, 'за упаковку');
  text = text.replace(/Цена указана за пачку\./g, 'Цена указана за упаковку.');
  text = text.replace(/за пачку/g, 'за упаковку');
  text = text.replace(/\/пачка/g, '/упаковка');
  if (text !== before) {
    fs.writeFileSync(file, text);
    console.log('updated', file);
  } else {
    console.log('no change', file);
  }
  const left = (text.match(/пачк/gi) || []).length;
  console.log('  пачк left:', left);
}
