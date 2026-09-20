import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'pergo-source.json');
const BASE = 'https://pergo-floor.ru/wp-json/wc/store/v1';

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DomPolaCatalogImporter/1.0',
    },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const total = Number(res.headers.get('x-wp-total') || 0);
  const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
  const data = await res.json();
  return { data, total, totalPages };
}

async function main() {
  const cats = await fetchJson(`${BASE}/products/categories?per_page=100`);
  console.log(`Categories: ${cats.data.length}`);

  const products = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${BASE}/products?per_page=100&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const { data, total, totalPages: tp } = await fetchJson(url);
    totalPages = tp || 1;
    products.push(...data);
    console.log(`  got ${data.length} (total header ${total}, pages ${totalPages})`);
    page += 1;
  } while (page <= totalPages);

  const payload = {
    scrapedAt: new Date().toISOString(),
    source: 'https://pergo-floor.ru/',
    categories: cats.data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent: c.parent,
      count: c.count,
      description: c.description || '',
      image: c.image?.src || null,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || String(p.id),
      permalink: p.permalink,
      short_description: p.short_description || '',
      description: p.description || '',
      images: (p.images || []).map((img) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || p.name,
      })),
      categories: (p.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      tags: (p.tags || []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      is_in_stock: p.is_in_stock,
    })),
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved ${payload.products.length} products -> ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
