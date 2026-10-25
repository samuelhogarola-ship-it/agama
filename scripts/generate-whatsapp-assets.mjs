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

/** Editable text and embedded existing brand assets; no remote resources or timestamps. */
export async function generateSocialAssets(outputDir) {
  const imageDir = new URL('../assets/img/', import.meta.url);
  const logo = (await fs.readFile(new URL('logo-circulo.png', imageDir))).toString('base64');
  const whatsapp = (await fs.readFile(new URL('whatsapp-white.svg', imageDir))).toString('base64');
  const text = (lines, x, y, size, weight = 400, color = '#ffffff') =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? Math.round(size * 1.3) : 0}">${line}</tspan>`).join('')}</text>`;
  const header = (top) => `<image href="data:image/png;base64,${logo}" x="80" y="${top}" width="150" height="150" preserveAspectRatio="xMidYMid meet"/>
    ${text(['AGAMA'], 255, top + 98, 68, 700)}
    <image href="data:image/svg+xml;base64,${whatsapp}" x="918" y="${top + 40}" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>`;
  const phone = (top) => `<rect x="60" y="${top}" width="960" height="156" rx="28" fill="#ffffff"/>
    ${text(['+52 55 4860 4275'], 100, top + 105, 82, 700, '#002f6c')}`;
  const story = `${header(300)}
    ${text(['AVISO IMPORTANTE'], 80, 550, 38, 700)}
    ${text(['Octubre de 2026'], 80, 607, 34)}
    ${text(['Cambiamos nuestro', 'WhatsApp'], 80, 728, 68, 700)}
    ${phone(884)}
    ${text(['La línea anterior, terminación 5156,', 'ya no pertenece a AGAMA.'], 80, 1140, 42, 700)}
    <path d="M80 1240H1000" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
    ${text(['Sólo mensajes, audios, fotos,', 'videos y documentos.'], 80, 1312, 42)}
    ${text(['No llamadas ni videollamadas.'], 80, 1468, 44, 700)}
    ${text(['Atención empresarial mediante Wasapi.io.'], 80, 1562, 36)}`;
  const square = `${header(72)}
    ${text(['NUEVO WHATSAPP AGAMA'], 80, 314, 48, 700)}
    ${phone(364)}
    ${text(['Guarda este número.'], 80, 603, 48, 700)}
    ${text(['Sólo mensajes y archivos.'], 80, 677, 42)}
    ${text(['No llamadas ni videollamadas.'], 80, 755, 44, 700)}
    <path d="M80 819H1000" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
    ${text(['La terminación 5156', 'ya no pertenece a AGAMA.'], 80, 895, 42)}`;
  await fs.mkdir(outputDir, { recursive: true });
  for (const [kind, height, content] of [['story', 1920, story], ['square', 1080, square]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
  <title>AGAMA — nuevo WhatsApp</title>
  <rect width="1080" height="${height}" fill="#002f6c"/>
  <g font-family="Arial, sans-serif">${content}
  </g>
</svg>\n`;
    const base = path.join(outputDir, `whatsapp-number-change-2026-${kind}`);
    await fs.writeFile(`${base}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${base}.png`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv.slice(2).join(' ');
    if (mode === '--qr-only') {
      await generateQrAssets(`https://wa.me/${NEW_CORPORATE_DIGITS}`, fileURLToPath(new URL('../assets/img/', import.meta.url)));
      console.log('qr_generated=png,webp dimensions=500x500');
    } else if (mode === '--social-only') {
      await generateSocialAssets(fileURLToPath(new URL('../assets/img/campaigns/', import.meta.url)));
      console.log('social_generated=story.svg,story.png,square.svg,square.png');
    } else throw new Error('Use --qr-only or --social-only.');
  } catch (error) {
    console.error(`WHATSAPP ASSETS: ${error.message}`);
    process.exitCode = 1;
  }
}
