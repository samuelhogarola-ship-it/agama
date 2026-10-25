import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import jsQR from 'jsqr';

// Independent decoding: no generator or destination constants are imported.
async function validateQrAssets() {
  for (const extension of ['png', 'webp']) {
    const file = fileURLToPath(new URL(`../assets/img/qr-whatsapp.${extension}`, import.meta.url));
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    console.log(`qr_${extension}=${decoded?.data ?? 'undecodable'}`);
    console.log(`qr_${extension}_dimensions=${info.width}x${info.height}`);
    if (info.width !== 500 || info.height !== 500) throw new Error(`${path.basename(file)} must be exactly 500x500.`);
    if (decoded?.data !== 'https://wa.me/525548604275') throw new Error(`${path.basename(file)} has an incorrect QR destination.`);
  }
}

/** Independently approved copy; also verifies that PNG pixels match the editable SVG. */
export async function validateSocialAssets(outputDir) {
  const required = {
    story: ['AVISO IMPORTANTE', 'Octubre de 2026', 'Cambiamos nuestro WhatsApp', '+52 55 4860 4275', 'La línea anterior, terminación 5156, ya no pertenece a AGAMA.', 'Sólo mensajes, audios, fotos, videos y documentos.', 'No llamadas ni videollamadas.', 'Atención empresarial mediante Wasapi.io.'],
    square: ['NUEVO WHATSAPP AGAMA', '+52 55 4860 4275', 'Guarda este número.', 'Sólo mensajes y archivos.', 'No llamadas ni videollamadas.', 'La terminación 5156 ya no pertenece a AGAMA.'],
  };
  for (const [kind, height] of [['story', 1920], ['square', 1080]]) {
    const base = path.join(outputDir, `whatsapp-number-change-2026-${kind}`);
    const svg = await fs.readFile(`${base}.svg`, 'utf8');
    const text = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
      .map((match) => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join(' ');
    for (const line of required[kind]) if (!text.includes(line)) throw new Error(`${kind}: incorrect copy; missing ${line}`);
    if (kind === 'square' && /2026|octubre|caduc|venc|retir/i.test(text)) throw new Error('square: date or expiry is forbidden.');
    for (const extension of ['svg', 'png']) {
      const info = await sharp(`${base}.${extension}`).metadata();
      if (info.width !== 1080 || info.height !== height) throw new Error(`${kind}.${extension} must be exactly 1080x${height}.`);
    }
    const rendered = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
    const actual = await sharp(`${base}.png`).ensureAlpha().raw().toBuffer();
    if (!rendered.equals(actual)) throw new Error(`${kind}: PNG render does not match SVG.`);
    if (kind === 'story') {
      const bandBytes = 1080 * 250 * 4;
      const background = [0, 47, 108, 255];
      for (const band of [actual.subarray(0, bandBytes), actual.subarray(-bandBytes)]) {
        if (!band.every((value, index) => value === background[index % 4])) {
          throw new Error('story: content falls outside the central safe area.');
        }
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv.slice(2).join(' ');
    if (mode === '--qr') await validateQrAssets();
    else if (mode === '--social') {
      await validateSocialAssets(fileURLToPath(new URL('../assets/img/campaigns/', import.meta.url)));
      console.log('story=1080x1920\nsquare=1080x1080\ncopy=ok');
    } else throw new Error('Use --qr or --social.');
  } catch (error) {
    console.error(`WHATSAPP ASSET VALIDATION: ${error.message}`);
    process.exitCode = 1;
  }
}
