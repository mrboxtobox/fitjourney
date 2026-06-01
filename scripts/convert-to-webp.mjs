/**
 * Convert generated PNG exercise illustrations to optimized WebP.
 * - Downscales to 1024px (form images and muscle maps are generated at 2K)
 * - Deletes the source PNG after a successful conversion
 *
 * Usage: node scripts/convert-to-webp.mjs
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const DIRS = [
  path.join(process.cwd(), 'public', 'exercises'),
  path.join(process.cwd(), 'public', 'exercises', 'muscles'),
];

const TARGET_SIZE = 1024;

async function convertDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  const pngs = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
  let converted = 0;

  for (const file of pngs) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(/\.png$/, '.webp'));

    await sharp(src)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dest);

    const srcKb = Math.round(fs.statSync(src).size / 1024);
    const destKb = Math.round(fs.statSync(dest).size / 1024);
    fs.unlinkSync(src);
    console.log(`  ✓ ${file} → ${path.basename(dest)} (${srcKb}KB → ${destKb}KB)`);
    converted++;
  }

  return converted;
}

let total = 0;
for (const dir of DIRS) {
  console.log(`\n${dir}:`);
  total += await convertDir(dir);
}
console.log(`\nConverted ${total} image(s).\n`);
