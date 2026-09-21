import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const outDir = path.join(root, 'apps/web/public/images/remote');

const ALLOW = [/primavera-opt\.ru/i];

function collectUrls() {
  const urls = new Set();
  for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const text = fs.readFileSync(path.join(dataDir, file), 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^"'\\\s]+/g)) {
      const url = m[0].replace(/\\u0026/g, '&');
      if (ALLOW.some((re) => re.test(url))) urls.add(url);
    }
  }
  return [...urls];
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname).replace(/\.[^.]+$/, '');
    const safe = base
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return safe || 'img';
  } catch {
    return 'img';
  }
}

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DomPolaBot/1.0)',
      Accept: 'image/*,*/*',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const urls = collectUrls();
  console.log(`Found ${urls.length} remote image URL(s)`);
  const map = new Map();

  for (const url of urls) {
    const slug = slugFromUrl(url);
    let name = `${slug}.webp`;
    let i = 2;
    while ([...map.values()].includes(`images/remote/${name}`)) {
      name = `${slug}-${i++}.webp`;
    }
    const dest = path.join(outDir, name);
    const rel = `images/remote/${name}`;
    try {
      if (!fs.existsSync(dest)) {
        const buf = await download(url);
        const webp = await sharp(buf, { failOn: 'none' })
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 72, effort: 4 })
          .toBuffer();
        fs.writeFileSync(dest, webp);
        console.log(`OK ${Math.round(webp.length / 1024)}KB ← ${url.slice(0, 80)}`);
      } else {
        console.log(`skip exists ${rel}`);
      }
      map.set(url, rel);
    } catch (err) {
      console.warn(`FAIL ${url}: ${err.message}`);
    }
  }

  if (!map.size) return;

  for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const full = path.join(dataDir, file);
    let text = fs.readFileSync(full, 'utf8');
    let changed = false;
    for (const [from, to] of map) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(full, text, 'utf8');
      console.log(`updated ${file}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
