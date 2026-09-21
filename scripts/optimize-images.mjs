/**
 * Compress catalog images for faster GitHub Pages loads.
 *
 * Usage:
 *   node scripts/optimize-images.mjs
 *   node scripts/optimize-images.mjs --force   # recompress even small gains
 *
 * Rules:
 *   images/hero/*     → max 1280px, WebP q72
 *   images/remote/*   → max 560px, WebP q62
 *   everything else   → max 640px, WebP q62
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imagesRoot = path.join(root, 'apps/web/public/images');
const dataDir = path.join(root, 'apps/web/public/data');
const FORCE = process.argv.includes('--force');
const CONCURRENCY = 6;

function profileFor(filePath) {
  const rel = path.relative(imagesRoot, filePath).replace(/\\/g, '/');
  if (rel.startsWith('hero/')) return { maxWidth: 1280, quality: 72 };
  if (rel.startsWith('remote/')) return { maxWidth: 560, quality: 62 };
  return { maxWidth: 640, quality: 62 };
}

async function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function optimizeOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return null;

  const input = fs.readFileSync(filePath);
  const before = input.length;
  const { maxWidth, quality } = profileFor(filePath);
  const outPath = filePath.replace(/\.(jpe?g|png|webp)$/i, '.webp');

  let pipeline = sharp(input, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  if ((meta.width || 0) > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const buffer = await pipeline
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();

  const minGain = FORCE ? 0.98 : 0.95; // keep if at least 2–5% smaller
  if (ext === '.webp' && buffer.length >= before * minGain) {
    return { from: filePath, to: filePath, before, after: before, skipped: true };
  }

  fs.writeFileSync(outPath, buffer);
  if (outPath !== filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { from: filePath, to: outPath, before, after: buffer.length, skipped: false };
}

function updateDataUrls(replacements) {
  if (!replacements.length) return 0;
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  let touches = 0;
  for (const file of files) {
    const full = path.join(dataDir, file);
    let text = fs.readFileSync(full, 'utf8');
    let changed = false;
    for (const [fromRel, toRel] of replacements) {
      if (text.includes(fromRel)) {
        text = text.split(fromRel).join(toRel);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(full, text, 'utf8');
      touches++;
    }
  }
  return touches;
}

async function mapPool(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  if (!fs.existsSync(imagesRoot)) {
    console.error('Missing', imagesRoot);
    process.exit(1);
  }

  const files = (await walk(imagesRoot)).filter((f) =>
    /\.(jpe?g|png|webp)$/i.test(f),
  );
  console.log(`Optimizing ${files.length} images (force=${FORCE})…`);

  let beforeTotal = 0;
  let afterTotal = 0;
  let converted = 0;
  let skipped = 0;
  const replacements = [];

  const results = await mapPool(files, CONCURRENCY, async (file) => {
    try {
      return await optimizeOne(file);
    } catch (err) {
      console.error('fail', path.relative(imagesRoot, file), err.message);
      return null;
    }
  });

  for (const result of results) {
    if (!result) continue;
    beforeTotal += result.before;
    afterTotal += result.after;
    if (result.skipped) {
      skipped++;
      continue;
    }
    converted++;
    const fromRel = path.relative(path.join(root, 'apps/web/public'), result.from).replace(/\\/g, '/');
    const toRel = path.relative(path.join(root, 'apps/web/public'), result.to).replace(/\\/g, '/');
    if (fromRel !== toRel) replacements.push([fromRel, toRel]);
    const pct = Math.round((1 - result.after / result.before) * 100);
    if (pct >= 8) {
      console.log(
        `−${pct}% ${path.relative(imagesRoot, result.to)} ${(result.before / 1024).toFixed(0)}→${(result.after / 1024).toFixed(0)} KB`,
      );
    }
  }

  const dataFiles = updateDataUrls(replacements);
  console.log(
    `\nDone. Converted ${converted}, skipped ${skipped}. ` +
      `${(beforeTotal / 1024 / 1024).toFixed(1)} MB → ${(afterTotal / 1024 / 1024).toFixed(1)} MB ` +
      `(−${Math.max(0, (beforeTotal - afterTotal) / 1024 / 1024).toFixed(1)} MB). ` +
      `Data files touched: ${dataFiles}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
