/**
 * Circular DomPola house favicon (Google-style round disc).
 * Usage: node scripts/generate-favicon-circle.mjs [path-to-house.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps/web/public');

const src =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-Admin-websitedompola/assets',
    'c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_f1df4ad08a2063f246ad6c1042f708d3_images_image-1810eed1-e4dd-4621-b3d6-7423c44bc9e7.png',
  );

if (!fs.existsSync(src)) {
  console.error('Source image not found:', src);
  process.exit(1);
}

const trimmed = await sharp(src).trim({ threshold: 12 }).ensureAlpha().toBuffer();

function circleSvg(size, fill = '#ffffff') {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${fill}"/>` +
      `</svg>`,
  );
}

async function circleFavicon(size) {
  const pad = Math.max(1, Math.round(size * 0.12));
  const inner = size - pad * 2;
  const house = await sharp(trimmed)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .ensureAlpha()
    .toBuffer();

  const composed = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: circleSvg(size, '#ffffff'), top: 0, left: 0 },
      { input: house, top: pad, left: pad },
    ])
    .png()
    .toBuffer();

  // Punch outside the circle to transparent → browsers show a round tab icon
  return sharp(composed)
    .composite([{ input: circleSvg(size, '#ffffff'), blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePng(name, size) {
  const buf = await circleFavicon(size);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`${name} ${size}×${size} ${(buf.length / 1024).toFixed(1)}KB`);
  return buf;
}

// SVG master: true circle for modern browsers
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="#ffffff"/>
  <g transform="translate(7.5 7.5) scale(0.765)">
    <path fill="#008D36" d="
      M32 4.5
      C33.35 4.5 34.5 5.15 35.25 6.2
      L57.1 33.0
      C58.05 34.2 57.2 36.1 55.6 36.1
      H50.2
      V55.2
      C50.2 57.3 48.5 59 46.4 59
      H17.6
      C15.5 59 13.8 57.3 13.8 55.2
      V36.1
      H8.4
      C6.8 36.1 5.95 34.2 6.9 33.0
      L28.75 6.2
      C29.5 5.15 30.65 4.5 32 4.5
      Z"/>
    <path fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
      d="M15.6 34.4 L32 13.2 L48.4 34.4"/>
    <rect x="27.8" y="41.5" width="8.4" height="17.5" rx="1.4" fill="#ffffff"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(outDir, 'favicon.svg'), svg);
console.log('favicon.svg');

await writePng('favicon-16.png', 16);
const png16 = await sharp(path.join(outDir, 'favicon-16.png')).png().toBuffer();
await writePng('favicon-32.png', 32);
const png32 = await sharp(path.join(outDir, 'favicon-32.png')).png().toBuffer();
await writePng('apple-touch-icon.png', 180);
await writePng('favicon-192.png', 192);
await writePng('favicon-512.png', 512);

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
console.log('Done.');
