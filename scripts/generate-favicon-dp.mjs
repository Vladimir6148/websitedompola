/**
 * Generate ДП monogram favicons — Source Sans 3 Semibold (site font, ~20% lighter than ExtraBold).
 * Usage: node scripts/generate-favicon-dp.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps/web/public');
const fontFile = path.join(root, 'scripts/fonts/SourceSans3-SemiBold.ttf');

const BRAND = '#1f8a3d';
const BRAND_DARK = '#0f5c28';
const FLATTEN = { r: 0x1f, g: 0x8a, b: 0x3d };

if (!fs.existsSync(fontFile)) {
  console.error('Missing font:', fontFile);
  process.exit(1);
}

/** Full-bleed green square + ДП in Source Sans 3 Semibold (600). */
function svgFor(size) {
  // Slightly larger on tiny sizes for legibility; weight stays 600 (~20% lighter than ExtraBold)
  const fontSize = size <= 32 ? size * 0.5 : size * 0.44;
  const tracking = size <= 32 ? Math.max(0.5, size * 0.02) : size * 0.04;
  // resvg ignores dominant-baseline — offset baseline ~0.35em below center
  const y = size * 0.5 + fontSize * 0.35;
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
    x="${size / 2}" y="${y}"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Source Sans 3"
    font-size="${fontSize}"
    font-weight="600"
    letter-spacing="${tracking}"
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
    x="16" y="21.5"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Source Sans 3, 'Segoe UI', Arial, sans-serif"
    font-size="15.5"
    font-weight="600"
    letter-spacing="1"
  >ДП</text>
</svg>
`;
}

function renderPng(size) {
  const resvg = new Resvg(svgFor(size), {
    fitTo: { mode: 'width', value: size },
    font: {
      fontFiles: [fontFile],
      loadSystemFonts: false,
      defaultFontFamily: 'Source Sans 3',
    },
    background: BRAND,
  });
  return Buffer.from(resvg.render().asPng());
}

async function writePng(name, size) {
  const buf = await sharp(renderPng(size))
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: FLATTEN })
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

fs.writeFileSync(path.join(outDir, 'favicon.svg'), svgMaster());
console.log('favicon.svg');

await writePng('favicon-16.png', 16);
const png16 = await sharp(path.join(outDir, 'favicon-16.png')).png().toBuffer();
await writePng('favicon-32.png', 32);
const png32 = await sharp(path.join(outDir, 'favicon-32.png')).png().toBuffer();
await writePng('apple-touch-icon.png', 180);
await writePng('favicon-512.png', 512);
await writeIco(png16, png32);
console.log('Done.');
