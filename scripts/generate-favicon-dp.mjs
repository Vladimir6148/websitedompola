/**
 * Generate ДП monogram favicons (opaque green square — no white/transparent edges).
 * Usage: node scripts/generate-favicon-dp.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps/web/public');

const BRAND = '#1f8a3d';
const BRAND_DARK = '#0f5c28';

/** Full-bleed green square + ДП. No rounded corners — transparent gaps become white edges in tabs. */
function svgFor(size) {
  const fontSize = size <= 32 ? size * 0.48 : size * 0.42;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <text
    x="50%" y="52%"
    dominant-baseline="middle"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    letter-spacing="${size <= 32 ? -size * 0.04 : -size * 0.02}"
  >ДП</text>
</svg>`;
}

function svgMaster() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" fill="url(#g)"/>
  <text
    x="16" y="17"
    dominant-baseline="middle"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="15"
    font-weight="800"
    letter-spacing="-1"
  >ДП</text>
</svg>
`;
}

async function writePng(name, size) {
  const flatten = { r: 0x1f, g: 0x8a, b: 0x3d };
  const buf = await sharp(Buffer.from(svgFor(size)))
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: flatten })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`${name} ${size}×${size} ${(buf.length / 1024).toFixed(1)}KB`);
}

async function writeIco() {
  const flatten = { r: 0x1f, g: 0x8a, b: 0x3d };
  const png16 = await sharp(Buffer.from(svgFor(16)))
    .resize(16, 16, { fit: 'fill' })
    .flatten({ background: flatten })
    .png()
    .toBuffer();
  const png32 = await sharp(Buffer.from(svgFor(32)))
    .resize(32, 32, { fit: 'fill' })
    .flatten({ background: flatten })
    .png()
    .toBuffer();
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

fs.writeFileSync(path.join(outDir, 'favicon.svg'), svgMaster());
console.log('favicon.svg');

await writePng('favicon-16.png', 16);
await writePng('favicon-32.png', 32);
await writePng('apple-touch-icon.png', 180);
await writePng('favicon-512.png', 512);
await writeIco();
console.log('Done.');
