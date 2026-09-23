import fs from 'node:fs';

const full = 'apps/web/public/data/products.json';
const data = JSON.parse(fs.readFileSync(full, 'utf8'));
let removed = 0;

for (const p of data) {
  if (!Array.isArray(p.images)) continue;
  const next = p.images.filter((img) => {
    const u = img?.url || '';
    if (/^https?:\/\//i.test(u)) {
      removed++;
      return false;
    }
    return true;
  });
  if (!next.length) {
    next.push({
      url: 'images/floor1.webp',
      alt: p.name || '',
      isPrimary: true,
      sortOrder: 0,
    });
  } else if (!next.some((i) => i.isPrimary)) {
    next[0].isPrimary = true;
  }
  p.images = next;
}

fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
console.log('removed external image urls:', removed);

let left = 0;
const hosts = {};
for (const p of data) {
  for (const i of p.images || []) {
    if (/^https?:\/\//i.test(i.url || '')) {
      left++;
      try {
        const h = new URL(i.url).host;
        hosts[h] = (hosts[h] || 0) + 1;
      } catch {}
    }
  }
}
console.log('external left in images:', left, hosts);
