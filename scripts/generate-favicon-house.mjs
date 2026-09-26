/**
 * DomPola house mark favicon — no chimney, floor planks at the base.
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
 * Unique mark: house without chimney + three floor planks (ДомПола).
 * viewBox 0 0 64 64 — scales cleanly to 16–512.
 */
function markSvg(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="${WHITE}" stroke="${GREEN}" stroke-width="4"/>
  <!-- house body + roof (no chimney) -->
  <path fill="${GREEN}" d="
    M32 14
    L48 28
    L48 29.5
    L44 29.5
    L44 46
    L20 46
    L20 29.5
    L16 29.5
    L16 28
    Z"/>
  <!-- roof underside highlight -->
  <path fill="none" stroke="${WHITE}" stroke-width="1.6" stroke-linecap="round"
    d="M19.2 29.2 L32 17.6 L44.8 29.2"/>
  <!-- arched doorway -->
  <path fill="${WHITE}" d="M29 46 V37.2 A3 3 0 0 1 35 37.2 V46 Z"/>
  <!-- floor planks — brand twist -->
  <rect x="18" y="48.2" width="28" height="1.7" rx="0.6" fill="${GREEN}"/>
  <rect x="20.5" y="50.8" width="23" height="1.5" rx="0.6" fill="${GREEN}"/>
  <rect x="23.5" y="53.2" width="17" height="1.4" rx="0.6" fill="${GREEN}"/>
</svg>`;
}

function renderPng(size) {
  const resvg = new Resvg(markSvg(size), {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  return Buffer.from(resvg.render().asPng());
}

async function writePng(name, size) {
  const buf = await sharp(renderPng(size))
    .resize(size, size, { fit: 'fill' })
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
await writePng('favicon-512.png', 512);
await writeIco(png16, png32);
console.log('Done.');
