/**
 * DomPola house favicon from brand mark — fills canvas (maximally large).
 * Usage: node scripts/generate-favicon-house.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps/web/public');
const GREEN = '#008D36';
const WHITE = '#ffffff';

/**
 * House fills ~90% of the square — no circle frame (matches user mark).
 * viewBox 0 0 64 64
 */
function markSvg(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${WHITE}"/>
  <!-- roof + walls as one mass with soft corners via path -->
  <path fill="${GREEN}" d="
    M32 6
    C33.2 6 34.2 6.55 34.9 7.45
    L55.2 32.1
    C56.1 33.2 55.35 35 53.9 35
    H48.5
    V54.5
    C48.5 56.4 46.95 58 45 58
    H19
    C17.05 58 15.5 56.4 15.5 54.5
    V35
    H10.1
    C8.65 35 7.9 33.2 8.8 32.1
    L29.1 7.45
    C29.8 6.55 30.8 6 32 6
    Z"/>
  <!-- white roof underside chevron (brand detail) -->
  <path fill="none" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
    d="M16.8 33.2 L32 14.6 L47.2 33.2"/>
  <!-- door cutout -->
  <rect x="28.2" y="42" width="7.6" height="16" rx="1.2" fill="${WHITE}"/>
</svg>`;
}

function renderPng(size) {
  const resvg = new Resvg(markSvg(size), {
    fitTo: { mode: 'width', value: size },
    background: WHITE,
  });
  return Buffer.from(resvg.render().asPng());
}

async function writePng(name, size) {
  const buf = await sharp(renderPng(size))
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`${name} ${size}×${size} ${(buf.length / 1024).toFixed(1)}KB`);
  return buf;
}

async function writeIco(png16, png32) {
  const entries = [
    { size: 16, data: png16 },
    { size: 32, data: png32 },
  ];
  const headerSize = 6;
  const dirSize = 16 * entries.length;
  const out = Buffer.alloc(headerSize + dirSize + png16.length + png32.length);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(entries.length, 4);
  let offset = headerSize + dirSize;
  let dp = 6;
  for (const e of entries) {
    out.writeUInt8(e.size, dp);
    out.writeUInt8(e.size, dp + 1);
    out.writeUInt8(0, dp + 2);
    out.writeUInt8(0, dp + 3);
    out.writeUInt16LE(1, dp + 4);
    out.writeUInt16LE(32, dp + 6);
    out.writeUInt32LE(e.data.length, dp + 8);
    out.writeUInt32LE(offset, dp + 12);
    e.data.copy(out, offset);
    offset += e.data.length;
    dp += 16;
  }
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), out);
  console.log(`favicon.ico ${(out.length / 1024).toFixed(1)}KB`);
}

const master = markSvg(64).replace(/ width="64" height="64"/, '');
fs.writeFileSync(path.join(outDir, 'favicon.svg'), master);
console.log('favicon.svg');

await writePng('favicon-16.png', 16);
const png16 = await sharp(path.join(outDir, 'favicon-16.png')).png().toBuffer();
await writePng('favicon-32.png', 32);
const png32 = await sharp(path.join(outDir, 'favicon-32.png')).png().toBuffer();
await writePng('apple-touch-icon.png', 180);
await writePng('favicon-192.png', 192);
await writePng('favicon-512.png', 512);
await writeIco(png16, png32);
console.log('Done.');
