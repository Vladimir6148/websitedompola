/**
 * Build sitemap.xml for GitHub Pages from static catalog JSON.
 * Run from apps/web: node ../../scripts/generate-sitemap.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'apps/web/public');
const dataDir = path.join(publicDir, 'data');

const SITE = process.env.VITE_SITE_URL || 'https://vladimir6148.github.io/websitedompola';
const BASE = SITE.replace(/\/$/, '');

function urlEntry(loc, changefreq = 'weekly', priority = '0.6') {
  return `  <url>\n    <loc>${BASE}${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));

const urls = [
  urlEntry('/', 'daily', '1.0'),
  urlEntry('/catalog', 'daily', '0.9'),
  urlEntry('/services', 'monthly', '0.5'),
  urlEntry('/promotions', 'weekly', '0.6'),
  urlEntry('/works', 'monthly', '0.5'),
  urlEntry('/stores', 'monthly', '0.5'),
  urlEntry('/contacts', 'monthly', '0.5'),
  urlEntry('/picker', 'monthly', '0.4'),
  urlEntry('/cart', 'monthly', '0.2'),
];

for (const c of categories) {
  if (c.active === false || !c.slug) continue;
  urls.push(urlEntry(`/catalog/${c.slug}`, 'daily', '0.8'));
}

let productCount = 0;
for (const p of products) {
  if (p.published === false || !p.slug) continue;
  urls.push(urlEntry(`/product/${p.slug}`, 'weekly', '0.5'));
  productCount++;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} urls (${productCount} products)`);
