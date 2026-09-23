import fs from 'node:fs';

const d = JSON.parse(fs.readFileSync('apps/web/public/data/products.json', 'utf8'));
let miss = 0;
let ok = 0;
for (const p of d) {
  for (const i of p.images || []) {
    const rel = String(i.url || '').split('?')[0];
    if (!rel.startsWith('images/')) {
      console.log('odd', p.sku, rel);
      continue;
    }
    const abs = `apps/web/public/${rel}`;
    if (fs.existsSync(abs)) ok++;
    else {
      miss++;
      if (miss <= 10) console.log('MISSING', p.sku, rel);
    }
  }
}
console.log({
  products: d.length,
  ok,
  miss,
  remoteFiles: fs
    .readdirSync('apps/web/public/images/remote')
    .filter((f) => f.endsWith('.webp')).length,
});

for (const f of ['home.json', 'categories.json']) {
  const t = fs.readFileSync(`apps/web/public/data/${f}`, 'utf8');
  JSON.parse(t);
  const https = t.match(/https?:\/\/[^"'\s]+/g) || [];
  console.log(f, 'https=', https.length, https.slice(0, 3));
}
