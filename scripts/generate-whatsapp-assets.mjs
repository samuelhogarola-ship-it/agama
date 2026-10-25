import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { NEW_CORPORATE_DIGITS } from './corporate-whatsapp-core.mjs';

/** Deterministic QR outputs; WebP is lossless so every module remains intact. */
export async function generateQrAssets(destination, outputDir) {
  const png = await QRCode.toBuffer(destination, {
    type: 'png', width: 500, margin: 4, errorCorrectionLevel: 'H',
    color: { dark: '#000000ff', light: '#ffffffff' },
  });
  const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'qr-whatsapp.png'), png);
  await fs.writeFile(path.join(outputDir, 'qr-whatsapp.webp'), webp);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).join(' ') !== '--qr-only') throw new Error('Use --qr-only.');
    await generateQrAssets(`https://wa.me/${NEW_CORPORATE_DIGITS}`, fileURLToPath(new URL('../assets/img/', import.meta.url)));
    console.log('qr_generated=png,webp dimensions=500x500');
  } catch (error) {
    console.error(`WHATSAPP ASSETS: ${error.message}`);
    process.exitCode = 1;
  }
}
