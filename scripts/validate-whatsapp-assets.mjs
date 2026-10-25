import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import jsQR from 'jsqr';

// Independent decoding: no generator or destination constants are imported.
try {
  if (process.argv.slice(2).join(' ') !== '--qr') throw new Error('Use --qr.');
  for (const extension of ['png', 'webp']) {
    const file = fileURLToPath(new URL(`../assets/img/qr-whatsapp.${extension}`, import.meta.url));
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    console.log(`qr_${extension}=${decoded?.data ?? 'undecodable'}`);
    console.log(`qr_${extension}_dimensions=${info.width}x${info.height}`);
    if (info.width !== 500 || info.height !== 500) throw new Error(`${path.basename(file)} must be exactly 500x500.`);
    if (decoded?.data !== 'https://wa.me/525548604275') throw new Error(`${path.basename(file)} has an incorrect QR destination.`);
  }
} catch (error) {
  console.error(`WHATSAPP ASSET VALIDATION: ${error.message}`);
  process.exitCode = 1;
}
