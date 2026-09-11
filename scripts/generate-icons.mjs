// One-off script to generate PWA icons from the couple's photo.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';

const SRC = path.join(process.cwd(), 'public/images/couple/1.jpg');
const OUT_DIR = path.join(process.cwd(), 'public/icons');

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Standard icons: cropped to a square, no padding.
  await sharp(SRC).resize(192, 192, { fit: 'cover' }).toFile(path.join(OUT_DIR, 'icon-192.png'));
  await sharp(SRC).resize(512, 512, { fit: 'cover' }).toFile(path.join(OUT_DIR, 'icon-512.png'));

  // Maskable icon needs safe-zone padding (~20%) since OS shape masks can
  // crop up to the outer ring — pad onto an onyx square so nothing important
  // gets clipped.
  await sharp(SRC)
    .resize(410, 410, { fit: 'cover' })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#0B0B0F' })
    .toFile(path.join(OUT_DIR, 'icon-maskable-512.png'));

  console.log('Generated PWA icons in public/icons/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
