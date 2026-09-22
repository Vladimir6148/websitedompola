import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'apps/web/public/images/floorfort');
const productsPath = path.join(root, 'apps/web/public/data/products.json');
fs.mkdirSync(imgDir, { recursive: true });

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

function idFor(prefix, seed) {
  return `${prefix}_${createHash('md5').update(seed).digest('hex').slice(0, 16)}`;
}

function curlDownload(url, dest) {
  const r = spawnSync(
    'curl.exe',
    ['-sL', '--max-time', '25', '-A', 'Mozilla/5.0', '-e', 'https://mirlaminata.com/', '-o', dest, url],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) return false;
  try {
    return fs.statSync(dest).size > 2000;
  } catch {
    return false;
  }
}

let ok = 0;
let fail = 0;
for (const p of products) {
  if (p.brand?.slug !== 'floorfort') continue;
  const remote = p.images?.find((i) => /^https?:/i.test(i.url))?.url;
  if (!remote) {
    fail++;
    continue;
  }
  const art = (remote.match(/\/(\d[\w-]*)(?:\/|_)/) || [])[1] || p.slug;
  const ext = remote.includes('.jpeg') ? 'jpeg' : 'jpg';
  const file = `${String(art).toLowerCase()}.${ext}`;
  const dest = path.join(imgDir, file);
  const localUrl = `images/floorfort/${file}`;

  let got = fs.existsSync(dest) && fs.statSync(dest).size > 2000;
  if (!got) {
    // try 800 then 228
    const urls = [
      remote,
      remote.replace('-800x800', '-228x228'),
      remote.replace('.jpg-800x800.jpg', '.jpg-228x228.jpg'),
    ];
    for (const u of urls) {
      if (curlDownload(u, dest)) {
        got = true;
        break;
      }
    }
  }

  if (got) {
    ok++;
    p.images = [
      {
        id: idFor('img', `${p.id}-local`),
        productId: p.id,
        url: localUrl,
        alt: p.name,
        isPrimary: true,
        sortOrder: 0,
        storageKey: null,
        createdAt: p.createdAt,
      },
      {
        id: idFor('img', `${p.id}-remote`),
        productId: p.id,
        url: remote,
        alt: p.name,
        isPrimary: false,
        sortOrder: 1,
        storageKey: null,
        createdAt: p.createdAt,
      },
    ];
  } else {
    fail++;
    console.log('FAIL', p.name, remote);
  }
}

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
console.log(JSON.stringify({ ok, fail }, null, 2));
