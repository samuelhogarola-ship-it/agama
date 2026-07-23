import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = process.cwd();
const generatedRoot = '/Users/sam/.codex/generated_images/019f890f-62e3-70f2-8eba-ba586460ebf2';
const outputDir = path.join(root, 'blog-assets/featured-images/generated');
const logoPath = path.join(root, 'assets/img/agama.svg');

const posts = [
  {
    slug: '001-que-significa-la-palabra-agama',
    source: 'call_VWrtKajyMcZak1GbWDK5xLpV.png',
    title: '¿Qué significa la palabra Agama?',
    alt: 'Lagarto agama junto a pigmentos de colores en un laboratorio de polímeros',
    description: 'Fotografía editorial de un lagarto agama y muestras de pigmentos que relaciona el origen del nombre AGAMA con el color para plásticos.',
    prompt: 'Lagarto agama de colores intensos observado como inspiración cromática junto a muestras físicas de pigmentos para plástico en un laboratorio industrial.',
  },
  {
    slug: '002-claves-de-productos',
    source: 'call_yEbwu3nJ72B93qJDVbcEEASf.png',
    title: 'Significado de las claves de producto',
    alt: 'Muestras industriales de pigmentos, masterbatch y aditivos organizadas por categorías',
    description: 'Fotografía de muestras de pigmentos, masterbatch y aditivos organizadas para representar el sistema de claves de producto de AGAMA.',
    prompt: 'Bolsas y frascos industriales de pigmento, masterbatch y aditivos organizados como un sistema claro de clasificación sobre una mesa técnica.',
  },
  {
    slug: '003-que-es-un-vehiculo',
    source: 'call_mI83xouW0LMl49XGmtiYuaLk.png',
    title: '¿Qué es un vehículo en masterbatch?',
    alt: 'Resina transparente, pigmento azul y pellets de masterbatch en laboratorio',
    description: 'Macrofotografía de resina, pigmento azul y pellets coloreados para explicar la función del vehículo o carrier en un masterbatch.',
    prompt: 'Pellets de resina translúcida recibiendo pigmento azul y una muestra final de pellets coloreados, en un laboratorio de polímeros.',
  },
  {
    slug: '004-como-formulamos-los-masterbatch-de-linea',
    source: 'call_gRmNGLKXuL5d8MGy7Wk9kjzp.png',
    title: '¿Cómo formulamos los master de línea?',
    alt: 'Técnico dosificando pigmento azul sobre resina para formular masterbatch',
    description: 'Fotografía de laboratorio de un técnico dosificando pigmentos, resina, aditivos y cargas para formular un masterbatch de línea.',
    prompt: 'Técnico con guantes dosificando pigmentos, aditivos, carga mineral y resina alrededor de una mezcla central de pellets.',
  },
  {
    slug: '005-que-es-realmente-el-plastico',
    source: 'call_MCwFmwYi4XaAmAuxScjDWPDI.png',
    title: '¿Qué es realmente el plástico?',
    alt: 'Película, pieza inyectada, perfil, envase y pellets de diferentes plásticos',
    description: 'Fotografía de objetos fabricados mediante película, inyección, extrusión y soplado junto a pellets de distintas resinas plásticas.',
    prompt: 'Composición de objetos plásticos técnicos reales: película transparente, pieza inyectada, perfil extruido, envase soplado y pellets.',
  },
  {
    slug: '006-por-que-hay-colores-que-se-salen-del-plastico',
    source: 'call_BMxPIDoYnPS1B7eawGRbfkA9.png',
    title: '¿Por qué hay colores que se salen del plástico?',
    alt: 'Comparación de piezas plásticas blancas con y sin migración de pigmento rojo',
    description: 'Fotografía comparativa de una pieza estable y otra con migración de pigmento hacia la superficie durante una prueba de calidad.',
    prompt: 'Piezas plásticas blancas, una estable y otra con un halo rojo de migración, junto a una placa ligeramente manchada y muestras de colorante.',
  },
  {
    slug: 'aditivos-para-plastico-en-mexico-7-preguntas-para-una-reunion-util-en-feria',
    source: 'call_NyeBej26BLErXc7fRCNyq7mI.png',
    title: 'Aditivos para plástico en México: 7 preguntas para una reunión útil en feria',
    alt: 'Reunión técnica sobre aditivos para plástico en una feria industrial mexicana',
    altEn: 'Technical meeting about plastic additives at an industrial trade show in Mexico',
    description: 'Fotografía de una asesora y un cliente revisando aditivos, pellets y una pieza moldeada durante una reunión técnica en feria.',
    prompt: 'Asesora y cliente examinando una botella de aditivo, muestras de pellets y una pieza moldeada en un stand industrial.',
  },
  {
    slug: 'agama-en-meximold-2026',
    source: 'call_k8LuKwA3rNF59nlkYMcmzVaC.png',
    title: 'AGAMA en Meximold: visítanos en la plaza 750',
    alt: 'Equipo técnico y visitantes junto a muestras de color para plástico en Meximold',
    altEn: 'Technical team and visitors with plastic color samples at Meximold',
    description: 'Fotografía del equipo técnico atendiendo visitantes y mostrando pigmentos, masterbatch y aditivos durante una feria de moldes e inyección.',
    prompt: 'Stand industrial contemporáneo con muestras de pigmentos, masterbatch y aditivos, equipo técnico y visitantes en un ambiente de moldes.',
  },
  {
    slug: 'agama-en-plastimagen-2026',
    source: 'call_Z6bOFPvyvqcO0Edhz9eoS81T.png',
    title: 'AGAMA en Plastimagen: encuéntranos en la expo del plástico',
    alt: 'Conversación técnica y muestras de pellets en una exposición de la industria del plástico',
    altEn: 'Technical conversation and pellet samples at a plastics industry exhibition',
    description: 'Fotografía del equipo de AGAMA conversando con fabricantes frente a muestras de color y maquinaria de procesamiento de plásticos.',
    prompt: 'Equipo técnico conversando con fabricantes frente a muestras de pigmentos, masterbatch y aditivos, con extrusión al fondo.',
  },
  {
    slug: 'como-comparar-proveedores-de-masterbatch-durante-meximold',
    source: 'call_uwTjKIPcYTsoqTxo6WQAQhxv.png',
    title: 'Cómo comparar proveedores de masterbatch durante Meximold',
    alt: 'Comprador y asesora comparando pellets y placas de color de masterbatch',
    altEn: 'Buyer and technical adviser comparing masterbatch pellets and color plaques',
    description: 'Fotografía de una evaluación técnica de pellets y placas de color para comparar proveedores de masterbatch en una feria industrial.',
    prompt: 'Comprador revisando lado a lado dos juegos de pellets y placas de color con una asesora técnica, una lupa y una hoja de evaluación.',
  },
  {
    slug: 'el-precio-es-una-respuesta-no-una-explicacion',
    source: 'call_G85nr3d7uARtRu42is7UH229.png',
    title: 'El precio es una respuesta, no una explicación',
    alt: 'Asesor técnico explicando a un cliente el desempeño de dos piezas plásticas',
    description: 'Fotografía de una conversación comercial centrada en calidad, desempeño y valor mediante la comparación de piezas moldeadas.',
    prompt: 'Asesor mostrando a un cliente dos piezas moldeadas con distinto desempeño, junto a pellets y una calculadora discreta.',
  },
  {
    slug: 'en-que-momento-dejamos-de-ser-estudiantes',
    source: 'call_SFOTccvE3gVHBKCIlkOADvFH.png',
    title: '¿En qué momento dejamos de ser estudiantes?',
    alt: 'Asesor técnico explicando muestras de plástico a una estudiante en una feria',
    description: 'Fotografía documental de un asesor y una estudiante compartiendo preguntas y conocimientos ante muestras de materiales plásticos.',
    prompt: 'Asesor técnico conversando con una joven estudiante de ingeniería mientras ambos observan pellets y piezas de color en una feria.',
  },
  {
    slug: 'mb-115-negro-kalo-mejora-su-dispersion',
    source: 'call_1IDIq128lerAhJFOdwIx5Quc.png',
    title: 'MB-115 Negro Kalo mejora su dispersión',
    alt: 'Pellets negros, placa uniforme y análisis de dispersión de masterbatch MB-115',
    description: 'Macrofotografía de pellets negros y una placa moldeada uniforme durante el control de dispersión del masterbatch MB-115 Negro Kalo.',
    prompt: 'Pellets negros premium, placa plástica negra uniforme y muestra microscópica homogénea sobre un banco de control de calidad.',
  },
  {
    slug: 'pigmentos-para-plastico-en-mexico-que-evaluar-antes-de-cambiar-de-proveedor',
    source: 'call_QLnSU6erAVASauDEORAVQ2wI.png',
    title: 'Pigmentos para plástico en México: qué evaluar antes de cambiar de proveedor',
    alt: 'Responsable de calidad comparando lotes de pigmento magenta y placas plásticas',
    altEn: 'Quality specialist comparing magenta pigment batches and plastic plaques',
    description: 'Fotografía de control de calidad con lotes de pigmento, placas moldeadas y medición instrumental para evaluar consistencia de proveedor.',
    prompt: 'Responsable de calidad comparando lotes de pigmento magenta bajo una cabina de luz, con placas moldeadas y espectrofotómetro.',
  },
  {
    slug: 'plan-de-marketing-b2b-para-ferias-industriales-en-mexico',
    source: 'call_RTdaJXB2xLDGU3RVCqjFwri3.png',
    title: 'Plan de marketing B2B para ferias industriales en México',
    alt: 'Equipo industrial planificando calendario y embudo comercial para una feria B2B',
    altEn: 'Industrial team planning a B2B trade show calendar and sales funnel',
    description: 'Fotografía cenital de un equipo organizando calendario, embudo comercial, seguimiento móvil y muestras para una feria industrial.',
    prompt: 'Equipo alrededor de una mesa con calendario, tarjetas de embudo, seguimiento móvil, pigmentos y credenciales de feria.',
  },
  {
    slug: 'por-que-varia-el-color-en-materiales-lechosos-o-con-base-blanca',
    source: 'call_udfebIaZKXyTPe4xxUrCvgMw.png',
    title: '¿Por qué varía el color en materiales lechosos o con base blanca?',
    alt: 'Placas transparentes, lechosas y blancas con variaciones de color azul',
    description: 'Fotografía comparativa de una formulación azul aplicada a placas transparentes, translúcidas y blancas bajo luz controlada.',
    prompt: 'La misma formulación azul aplicada a placas transparentes, translúcidas lechosas y blancas, mostrando variaciones de intensidad.',
  },
  {
    slug: 'que-es-un-pigmento-y-que-es-un-masterbatch',
    source: 'call_KpfUBiY6bA0D4AzdDlmM4gcO.png',
    title: '¿Qué es un pigmento y qué es un masterbatch?',
    alt: 'Comparación de pigmento azul en polvo y pellets azules de masterbatch',
    description: 'Fotografía comparativa de pigmento azul en polvo, pellets de masterbatch y placas moldeadas con el resultado de color.',
    prompt: 'Pigmento azul en polvo a la izquierda, pellets de masterbatch a la derecha y dos placas moldeadas al centro.',
  },
];

await fs.mkdir(outputDir, { recursive: true });
const logo = await sharp(logoPath).resize({ width: 210, height: 68, fit: 'contain' }).png().toBuffer();
const plaque = Buffer.from(
  '<svg width="250" height="94" xmlns="http://www.w3.org/2000/svg"><rect width="250" height="94" rx="13" fill="white" fill-opacity=".94"/></svg>',
);
const tallPlaque = Buffer.from(
  '<svg width="250" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="250" height="150" rx="13" fill="white"/></svg>',
);

for (const post of posts) {
  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${post.title}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${post.description}</rdf:li></rdf:Alt></dc:description><dc:creator><rdf:Seq><rdf:li>AGAMA Pigmentos &amp; Masterbatch</rdf:li></rdf:Seq></dc:creator><xmpRights:Marked>True</xmpRights:Marked></rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
  const output = path.join(outputDir, `${post.slug}-agama.webp`);
  await sharp(path.join(generatedRoot, post.source))
    .resize(1600, 900, { fit: 'cover', position: 'centre' })
    .composite([
      { input: post.slug === 'agama-en-meximold-2026' ? tallPlaque : plaque, left: 1318, top: 32 },
      { input: logo, left: 1338, top: 45 },
    ])
    .withXmp(xmp)
    .webp({ quality: 86, effort: 6 })
    .toFile(output);
}

await fs.writeFile(
  path.join(root, 'docs/blog-image-prompts.json'),
  `${JSON.stringify(
    {
      generatedAt: '2026-07-23',
      sharedDirection:
        'Fotografía editorial horizontal 16:9, hiperrealista, industrial y coherente con AGAMA; paleta azul, blanco y acentos del tema; sin texto ni logotipos generados; aplicación posterior del SVG oficial de AGAMA.',
      posts: posts.map(({ slug, title, alt, altEn, description, prompt }) => ({
        slug,
        title,
        alt,
        ...(altEn ? { altEn } : {}),
        description,
        prompt,
      })),
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${posts.length} branded blog images in ${path.relative(root, outputDir)}`);
