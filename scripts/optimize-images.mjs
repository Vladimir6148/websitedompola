import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesRoot = path.resolve(__dirname, '../apps/web/public/images');

const MAX_WIDTH = 900;
const QUALITY = 72;

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return null;

  const input = fs.readFileSync(filePath);
  const before = input.length;
  let pipeline = sharp(input, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  if ((meta.width || 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const outPath = filePath.replace(/\.(png|jpeg)$/i, '.jpg');
  const buffer = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

  if (buffer.length >= before * 0.95 && path.extname(filePath).toLowerCase() !== '.png') {
    return { filePath, before, after: before, skipped: true };
  }

  fs.writeFileSync(outPath, buffer);
  if (outPath !== filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { filePath: outPath, before, after: buffer.length, skipped: false };
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function main() {
  const files = await walk(imagesRoot);
  let saved = 0;
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const file of files) {
    try {
      const result = await optimizeFile(file);
      if (!result) continue;
      beforeTotal += result.before;
      afterTotal += result.after;
      saved += result.before - result.after;
      const pct = Math.round((1 - result.after / result.before) * 100);
      console.log(
        `${result.skipped ? 'skip' : 'ok  '} ${pct}% ${path.relative(imagesRoot, result.filePath)} ${(result.before / 1024).toFixed(0)}→${(result.after / 1024).toFixed(0)}KB`,
      );
    } catch (err) {
      console.error('fail', file, err.message);
    }
  }

  console.log(
    `\nTotal ${(beforeTotal / 1024 / 1024).toFixed(1)}MB → ${(afterTotal / 1024 / 1024).toFixed(1)}MB (saved ${(saved / 1024 / 1024).toFixed(1)}MB)`,
  );
}

main();
