import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'apps/web/public/data');
const outDir = path.join(root, 'apps/web/public/images/remote');
const CONCURRENCY = 4;

/** External hosts still hotlinked from the catalog. */
const ALLOW = [
  /pergo-floor\.ru/i,
  /alta-step\.ru/i,
  /static\.tildacdn\.com/i,
  /mirlaminata\.com/i,
  /vladimir6148\.github\.io/i,
  /primavera-opt\.ru/i,
];

function collectUrls() {
  const urls = new Set();
  for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const text = fs.readFileSync(path.join(dataDir, file), 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^"'\\\s]+/g)) {
      const url = m[0].replace(/\\u0026/g, '&');
      if (!ALLOW.some((re) => re.test(url))) continue;
      const hasExt = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
      const looksLikeCdn =
        /tildacdn|wp-content\/uploads|\/images\/|\/resize/i.test(url);
      if (!hasExt && !looksLikeCdn) continue;
      urls.add(url);
    }
  }
  return [...urls];
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').split('.')[0];
    const base = path.basename(u.pathname).replace(/\.[^.]+$/, '') || 'img';
    const safe = `${host}-${base}`
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    return safe || 'img';
  } catch {
    return 'img';
  }
}

function normalizeUrl(url) {
  // Encode spaces / Cyrillic path segments that break fetch
  try {
    const u = new URL(url);
    u.pathname = u.pathname
      .split('/')
      .map((seg) => {
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch {
          return encodeURIComponent(seg);
        }
      })
      .join('/');
    return u.toString();
  } catch {
    return url.replace(/ /g, '%20');
  }
}

async function download(url, attempt = 1) {
  const target = normalizeUrl(url);
  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: new URL(target).origin + '/',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) throw new Error(`too small ${buf.length}B`);
    return buf;
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return download(url, attempt + 1);
    }
    throw err;
  }
}

async function mapOne(url, usedNames) {
  // Prefer already-local github.io assets without network
  const gh = url.match(/vladimir6148\.github\.io\/websitedompola\/(images\/[^?#]+)/i);
  if (gh) {
    const rel = gh[1].replace(/\.(jpe?g|png)$/i, '.webp');
    const abs = path.join(root, 'apps/web/public', rel);
    const absOrig = path.join(root, 'apps/web/public', gh[1]);
    if (fs.existsSync(abs)) return [url, rel];
    if (fs.existsSync(absOrig)) return [url, gh[1]];
  }

  const slug = slugFromUrl(url);
  let name = `${slug}.webp`;
  let i = 2;
  while (usedNames.has(name)) {
    name = `${slug}-${i++}.webp`;
  }
  usedNames.add(name);
  const dest = path.join(outDir, name);
  const rel = `images/remote/${name}`;
  try {
    if (!fs.existsSync(dest)) {
      const buf = await download(url);
      let webp;
      try {
        webp = await sharp(buf, { failOn: 'none' })
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 72, effort: 4 })
          .toBuffer();
      } catch (sharpErr) {
        // Some WP "images" are HTML/PDF — skip
        throw new Error(`sharp: ${sharpErr.message}`);
      }
      fs.writeFileSync(dest, webp);
      console.log(`OK ${Math.round(webp.length / 1024)}KB ← ${url.slice(0, 90)}`);
    } else {
      console.log(`skip ${rel}`);
    }
    return [url, rel];
  } catch (err) {
    console.warn(`FAIL ${err.message} ← ${url.slice(0, 90)}`);
    return null;
  }
}

async function pool(items, limit, worker) {
  const results = [];
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await worker(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const urls = collectUrls();
  console.log(`Found ${urls.length} remote image URL(s)`);
  const usedNames = new Set(
    fs.existsSync(outDir)
      ? fs.readdirSync(outDir).filter((f) => f.endsWith('.webp'))
      : [],
  );
  // Pre-reserve names for existing remote files that match slug collisions
  const map = new Map();

  const pairs = await pool(urls, CONCURRENCY, (url) => mapOne(url, usedNames));
  for (const p of pairs) {
    if (p) map.set(p[0], p[1]);
  }

  console.log(`Mapped ${map.size}/${urls.length}`);
  if (!map.size) return;

  for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
    const full = path.join(dataDir, file);
    let text = fs.readFileSync(full, 'utf8');
    let changed = false;
    // Longer URLs first to avoid partial replacements
    const entries = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of entries) {
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
