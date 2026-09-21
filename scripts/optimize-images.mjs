import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imagesRoot = path.join(root, 'apps/web/public/images');
const dataDir = path.join(root, 'apps/web/public/data');

const MAX_WIDTH = 800;
const WEBP_QUALITY = 68;

async function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function optimizeToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return null;

  const input = fs.readFileSync(filePath);
  const before = input.length;
  const outPath = filePath.replace(/\.(jpe?g|png|webp)$/i, '.webp');

  let pipeline = sharp(input, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  if ((meta.width || 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const buffer = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();

  // Skip rewrite if already webp and barely smaller
  if (ext === '.webp' && buffer.length >= before * 0.92) {
    return { from: filePath, to: filePath, before, after: before, skipped: true };
  }

  fs.writeFileSync(outPath, buffer);
  if (outPath !== filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { from: filePath, to: outPath, before, after: buffer.length, skipped: false };
}

function updateDataUrls(replacements) {
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
      // also without leading path variants
      const fromName = fromRel.replace(/^images\//, '');
      const toName = toRel.replace(/^images\//, '');
      if (fromName !== fromRel && text.includes(fromName)) {
        // avoid blind replace of bare filenames that collide — only path forms
      }
    }
    if (changed) {
      fs.writeFileSync(full, text, 'utf8');
      touches++;
    }
  }
  return touches;
}

async function main() {
  const files = await walk(imagesRoot);
  const replacements = [];
  let beforeTotal = 0;
  let afterTotal = 0;
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const result = await optimizeToWebp(file);
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
      if (pct >= 5) {
        console.log(
          `ok ${pct}% ${path.relative(imagesRoot, result.to)} ${(result.before / 1024).toFixed(0)}→${(result.after / 1024).toFixed(0)}KB`,
        );
      }
    } catch (err) {
      console.error('fail', path.relative(imagesRoot, file), err.message);
    }
  }

  const dataFiles = updateDataUrls(replacements);
  console.log(
    `\nConverted ${converted}, skipped ${skipped}. ` +
      `${(beforeTotal / 1024 / 1024).toFixed(1)}MB → ${(afterTotal / 1024 / 1024).toFixed(1)}MB ` +
      `(−${((beforeTotal - afterTotal) / 1024 / 1024).toFixed(1)}MB). Updated ${dataFiles} data files, ${replacements.length} path renames.`,
  );
}

main();
