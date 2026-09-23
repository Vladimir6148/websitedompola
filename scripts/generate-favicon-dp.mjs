/**
 * Generate ДП monogram favicons for better readability at 16×16.
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

function svgFor(size) {
  // Slightly larger letters on tiny sizes for legibility
  const fontSize = size <= 32 ? size * 0.42 : size * 0.38;
  const stroke = Math.max(1, Math.round(size * 0.02));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - stroke}" fill="url(#g)" stroke="#ffffff" stroke-width="${stroke}" stroke-opacity="0.35"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    letter-spacing="${size <= 32 ? -size * 0.02 : 0}"
  >ДП</text>
</svg>`;
}

async function writePng(name, size) {
  const buf = await sharp(Buffer.from(svgFor(size)))
    .png()
    .toBuffer();
  const dest = path.join(outDir, name);
  fs.writeFileSync(dest, buf);
  console.log(`${name} ${size}×${size} ${(buf.length / 1024).toFixed(1)}KB`);
}

async function writeIco() {
  const png16 = await sharp(Buffer.from(svgFor(16))).png().toBuffer();
  const png32 = await sharp(Buffer.from(svgFor(32))).png().toBuffer();
  const entries = [
    { size: 16, data: png16 },
    { size: 32, data: png32 },
  ];
  const headerSize = 6;
  const dirSize = 16 * entries.length;
  const out = Buffer.alloc(headerSize + dirSize + png16.length + png32.length);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2); // ICO
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

await writePng('favicon-16.png', 16);
await writePng('favicon-32.png', 32);
await writePng('apple-touch-icon.png', 180);
await writePng('favicon-512.png', 512);
await writeIco();
console.log('Done.');
