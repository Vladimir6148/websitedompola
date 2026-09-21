import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mapPath = path.join(__dirname, '_tmp/alpine-lf-images.json');
const imgDir = path.join(root, 'apps/web/public/images/alpine');
const productsPath = path.join(root, 'apps/web/public/data/products.json');

const MAX_WIDTH = 800;
const WEBP_QUALITY = 68;

fs.mkdirSync(imgDir, { recursive: true });

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

async function download(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'DomPolaImporter/1.0',
        Referer: 'https://alpinefloor.su/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function toWebp(buf) {
  let pipeline = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  if ((meta.width || 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  return pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
}

function fileSlug(art) {
  return art.toLowerCase().replace(/_/g, '-');
}

async function main() {
  const results = {};
  let ok = 0;
  let fail = 0;

  for (const [art, entry] of Object.entries(map)) {
    const url = entry.imageUrl;
    if (!url) {
      console.error('no url', art);
      fail++;
      continue;
    }
    const outRel = `images/alpine/${fileSlug(art)}.webp`;
    const outAbs = path.join(root, 'apps/web/public', outRel);
    try {
      if (!fs.existsSync(outAbs) || fs.statSync(outAbs).size < 800) {
        const raw = await download(url);
        const webp = await toWebp(raw);
        fs.writeFileSync(outAbs, webp);
        console.log(
          `ok ${art} ${(raw.length / 1024).toFixed(0)}→${(webp.length / 1024).toFixed(0)}KB`,
        );
      } else {
        console.log(`skip ${art} exists`);
      }
      results[art] = outRel.replace(/\\/g, '/');
      ok++;
    } catch (err) {
      console.error(`fail ${art}`, err.message);
      fail++;
    }
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  let updated = 0;
  for (const p of products) {
    if (p.brand?.slug !== 'alpine-floor') continue;
    if (p.category?.slug !== 'laminate') continue;
    const art =
      p.characteristics?.find((c) => c.key === 'article')?.value ||
      (p.sku || '').replace(/^LAM-/, '');
    const rel = results[art];
    if (!rel) continue;
    if (!Array.isArray(p.images) || !p.images.length) {
      p.images = [
        {
          id: `img_${(p.id || art).replace(/^prod_/, '')}`,
          url: rel,
          alt: p.name,
          isPrimary: true,
          sortOrder: 0,
          storageKey: null,
        },
      ];
    } else {
      p.images[0].url = rel;
      if (!p.images[0].alt) p.images[0].alt = p.name;
    }
    updated++;
  }

  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
  console.log(`\nDownloaded/kept ${ok}, failed ${fail}. Updated ${updated} products (images only).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
