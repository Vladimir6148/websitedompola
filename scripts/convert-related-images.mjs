import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const src = 'C:/Users/Admin/.cursor/projects/c-Users-Admin-websitedompola/assets';
const dst = 'C:/Users/Admin/websitedompola/apps/web/public/images/related';

const pairs = [
  ['podlozhka-xps.png', 'podlozhka-xps.jpg'],
  ['plintus.png', 'plintus.jpg'],
  ['klej.png', 'klej.jpg'],
  ['podlozhka-pine.png', 'podlozhka-pine.jpg'],
];

for (const [from, to] of pairs) {
  const buf = await sharp(path.join(src, from))
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(path.join(dst, to), buf);
  console.log(to, Math.round(buf.length / 1024) + 'KB');
}
