function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function preserveCase(source, replacement) {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source === source.toLowerCase()) return replacement.toLowerCase();

  const words = source.split(/\s+/).filter(Boolean);
  const isTitleCase = words.length > 0 && words.every((word) => word[0] === word[0]?.toUpperCase());
  if (isTitleCase) {
    return replacement.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  }

  return replacement;
}

function replaceInsensitive(text, search, replacement) {
  return text.replace(new RegExp(escapeRegex(search), 'giu'), (match) => preserveCase(match, replacement));
}

function applyReplacements(text, replacements) {
  return replacements.reduce((result, [search, replacement]) => replaceInsensitive(result, search, replacement), text);
}

function cleanupEnglish(text) {
  return text
    .replace(/\bthat provides a ([a-z]+) vibrant\b/giu, 'that provides a vibrant $1')
    .replace(/\b(El|La) ([A-Z0-9-]+) es perfecto para molding processes como /gu, '$2 is ideal for molding processes such as ')
    .replace(/\b(El|La) ([A-Z0-9-]+) es perfecto para molding processes por /gu, '$2 is ideal for molding processes for ')
    .replace(/Su formulación permite una integración fluida con resinas (?:vírgenes|virgines) y (?:recicladas|recycleds), ensuring high-quality results\./gu, 'Its formulation integrates smoothly with virgin and recycled resins, ensuring high-quality results.')
    .replace(/Su formulación permite una integración fluida con resins virgines y recycleds, ensuring high-quality results\./gu, 'Its formulation integrates smoothly with virgin and recycled resins, ensuring high-quality results.')
    .replace(/Su formulación permite una integración fluida con resins\s*<strong ?>(recycleds)<\/strong ?>, ensuring high-quality results\./gu, 'Its formulation integrates smoothly with <strong>recycled resins</strong>, ensuring high-quality results.')
    .replace(/Su formulación permite una integración fluida con\s*<strong >?\s*resinas recycleds\s*<\/strong >?, ensuring high-quality results\./gu, 'Its formulation integrates smoothly with <strong>recycled resins</strong>, ensuring high-quality results.')
    .replace(/apto para processs a temperaturas estándar\./gu, 'suitable for standard-temperature processes.')
    .replace(/([A-Z0-9-]+) es un protector UV en microesferas que protects plastics from sunlight\./gu, '$1 is a UV protector in microsphere form that protects plastics from sunlight.')
    .replace(/When exposed to sunlight, it neutralizes free radicals y detiene la fotodegradación from sus primeros pasos\./gu, 'When exposed to sunlight, it neutralizes free radicals and stops photodegradation from its earliest stages.')
    .replace(/Polystyrene alto o medium impacto/gu, 'High- or medium-impact polystyrene')
    .replace(/([0-9.]+) y ([0-9.]+) grams per kilogram of resin/gu, '$1 and $2 grams per kilogram of resin')
    .replace(/\s+y\s+<strong/gu, ' and <strong')
    .replace(/<\/strong>\s+y\s+<strong/gu, '</strong> and <strong')
    .replace(/\s+y\s+<strong >/gu, ' and <strong >')
    .replace(/\s+y\s+rotomolding/gu, ' and rotomolding')
    .replace(/\s+y\s+blow molding/gu, ' and blow molding')
    .replace(/\s+y\s+extrusion/gu, ' and extrusion')
    .replace(/\s+y\s+injection/gu, ' and injection')
    .replace(/\bfrom unos /gu, 'from about ')
    .replace(/\bfilms\b/gu, 'film')
    .replace(/\bfilm plástica\b/gu, 'plastic film')
    .replace(/\bblue traslúcido\b/gu, 'translucent blue')
    .replace(/\byellow traslúcido\b/gu, 'translucent yellow')
    .replace(/\borange traslúcido\b/gu, 'translucent orange')
    .replace(/Está formulado con ácidos grasos de alta pureza\./gu, 'It is formulated with high-purity fatty acids.')
    .replace(/AD-305 es un aditivo en polvo que facilita el desmoldeo de units plásticas hechas por injection o blow molding\./gu, 'AD-305 is a powdered additive that facilitates the release of plastic parts made by injection or blow molding.')
    .replace(/Se produce con ácidos grasos de alta pureza para asegurar buena calidad\./gu, 'It is made with high-purity fatty acids to ensure reliable quality.')
    .replace(/Se produce con ácidos grasos de alta pureza/gu, 'It is made with high-purity fatty acids')
    .replace(/AD-309 es un desmoldante de acción interna presentado en microesfera\./gu, 'AD-309 is an internal mold-release additive presented in microsphere form.')
    .replace(/AD-317 es un polvo white derivado del zinc que actúa como lubricante interno, dispersante térmico y estabilizador para plásticos\./gu, 'AD-317 is a white zinc-derived powder that acts as an internal lubricant, thermal dispersant, and stabilizer for plastics.')
    .replace(/Al enfriarse, emunit a migrar hacia la superficie\./gu, 'As it cools, it starts to migrate toward the surface.')
    .replace(/Rendimiento eficiente: bajo costo y application sencilla\./gu, 'Efficient performance: low cost and simple application.')
    .replace(/Mantiene su efecto constante durante todo el process\./gu, 'It maintains a consistent effect throughout the entire process.')
    .replace(/Facilita la liberación de units moldeadas por <strong ?>(injection)<\/strong ?> o <strong ?>(blow molding)<\/strong ?>\./gu, 'It facilitates the release of parts molded by <strong>$1</strong> or <strong>$2</strong>.')
    .replace(/Compatible con <strong ?>(moldeo por injection)<\/strong ?>, <strong ?>(extrusion)<\/strong ?> and <strong ?>(rotomolding)<\/strong ?>\./gu, 'Compatible with <strong>injection molding</strong>, <strong>extrusion</strong>, and <strong>rotomolding</strong>.')
    .replace(/It is used to release plastic parts produced by <strong ?>(injection)<\/strong ?>, <strong ?>(blow molding)<\/strong ?> o <strong ?>(thermoforming)<\/strong ?>\./gu, 'It is used to release plastic parts produced by <strong>$1</strong>, <strong>$2</strong>, or <strong>$3</strong>.')
    .replace(/It is used to release plastic parts produced by <strong ?>(injection)<\/strong ?>, <strong ?>(blow molding)<\/strong ?> o <strong ?>(thermoforming)<\/strong ?>, con compatibilidad para decorados finales\./gu, 'It is used to release plastic parts produced by <strong>$1</strong>, <strong>$2</strong>, or <strong>$3</strong>, with compatibility for final decorative finishes.')
    .replace(/It is formulated to release plastic parts produced by <strong ?>(injection)<\/strong ?>, <strong ?>(blow molding)<\/strong ?> o <strong ?>(thermoforming)<\/strong ?>, con compatibilidad para decorados finales\./gu, 'It is formulated to release plastic parts produced by <strong>$1</strong>, <strong>$2</strong>, or <strong>$3</strong>, with compatibility for final decorative finishes.')
    .replace(/Mejora las propiedades mecánicas sin perder resistencia ni integridad física\./gu, 'It improves mechanical properties without losing strength or structural integrity.')
    .replace(/Mejora la fluidez del plástico durante processs como injection, extrusion, blow molding and rotomolding\./gu, 'It improves plastic flow during processes such as injection, extrusion, blow molding, and rotomolding.')
    .replace(/Calzado/gu, 'Footwear')
    .replace(/Aislamiento \(espumas térmicas o acústicas\)/gu, 'Insulation (thermal or acoustic foams)')
    .replace(/Embalaje/gu, 'Packaging')
    .replace(/Toys y artículos para casa/gu, 'Toys and household items')
    .replace(/Partes automotrices/gu, 'Automotive parts')
    .replace(/Artículos deportivos/gu, 'Sports equipment')
    .replace(/\bpor <strong >extrusion para fabricación de film principalmente\.<\/strong >/gu, '<strong>extrusion, mainly for film manufacturing.</strong>')
    .replace(/\bpor <strong>extrusion para la fabricación de film plástica\.<\/strong>/gu, '<strong>extrusion for plastic film manufacturing.</strong>')
    .replace(/\bpor <strong >extrusion para la fabricación de film plástica\.<\/strong >/gu, '<strong>extrusion for plastic film manufacturing.</strong>')
    .replace(/MB-([0-9]+) is ideal for molding processes for <strong ?>(extrusion para fabricación de film principalmente\.)<\/strong ?>/gu, 'MB-$1 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>')
    .replace(/MB-([0-9]+) is ideal for molding processes for <strong ?>(extrusion para la fabricación de plastic film\.)<\/strong ?>/gu, 'MB-$1 is ideal for molding processes for <strong>extrusion in plastic film manufacturing.</strong>')
    .replace(/MB-([0-9]+) is ideal for molding processes for <strong ?>(injection and extrusion principalmente\.)<\/strong ?>/gu, 'MB-$1 is ideal for molding processes for <strong>injection and extrusion, mainly.</strong>')
    .replace(/\bpor <strong >injection y extrusion principalmente\.<\/strong >/gu, '<strong>injection and extrusion, mainly.</strong>')
    .replace(/\bPuede evaluarse en<strong > injection<\/strong> o <strong >blow molding<\/strong>, pero podría presentar inconvenientes de dispersión\./gu, 'It can be evaluated in <strong>injection</strong> or <strong>blow molding</strong>, but dispersion issues may occur.')
    .replace(/Esto resulta specialmente útil al trabajar con <strong ?>(resins recuperadas o recycleds)<\/strong ?>, donde las formas irregulares de los pellets dificultan una coloración uniforme\./gu, 'This is especially useful when working with <strong>recovered or recycled resins</strong>, where irregular pellet shapes make uniform coloration more difficult.')
    .replace(/Puede emplearse en líneas de producción de <strong ?>(injection, extrusion, blow molding o peletizado)<\/strong ?>\./gu, 'It can be used in production lines for <strong>injection, extrusion, blow molding, or pelletizing</strong>.')
    .replace(/AD-316 W-Slip es un desmoldante base agua formulado con derivados de silicón y emulsificantes que crean una film de liberación entre el molde y el plástico fundido\./gu, 'AD-316 W-Slip is a water-based mold-release agent formulated with silicone derivatives and emulsifiers that create a release film between the mold and the molten plastic.')
    .replace(/AD-316 W-Slip es un desmoldante base agua formulado con derivados de silic[oó]n y emulsificantes que crean una film de liberaci[oó]n entre el molde y el pl[aá]stico fundido\./gu, 'AD-316 W-Slip is a water-based mold-release agent formulated with silicone derivatives and emulsifiers that create a release film between the mold and the molten plastic.')
    .replace(/Está diseñado para processs de <strong ?>(rotomolding)<\/strong ?> donde se requiere una separación limpia, rápida y sin dañar las units o el molde\./gu, 'It is designed for <strong>$1</strong> processes where clean, fast separation is required without damaging the parts or the mold.')
    .replace(/Pesa la cantidad adecuada de aditivo según la resin\./gu, 'Weigh the correct amount of additive according to the resin.')
    .replace(/Disminuye la fricción entre la resin y la maquinaria\./gu, 'It reduces friction between the resin and the machinery.')
    .replace(/Disminuye la fricción entre la resin y los equipos de procesamiento\./gu, 'It reduces friction between the resin and processing equipment.')
    .replace(/Mejora el flujo del material, incluso en compuestos con pigmentos o cargas minerales\./gu, 'It improves material flow, even in compounds with pigments or mineral fillers.')
    .replace(/Dosis inicial: entre <strong ?>(0\.2 % y 8\.0 %)<\/strong ?> \(2 a 8 grams por kg de resin\), según application y exigencia\./gu, 'Initial dosage: between <strong>0.2% and 8.0%</strong> (2 to 8 grams per kg of resin), depending on the application and performance requirements.')
    .replace(/<strong ?>(No usar en PVC compounds rígido o flexible)<\/strong ?>, ya que puede causar desprendimiento de átomos de cloro del polímero, lo que afecta su estabilidad y propiedades\./gu, '<strong>Do not use in rigid or flexible PVC compounds</strong>, as it may cause chlorine atoms to separate from the polymer, affecting its stability and properties.')
    .replace(/AD-313 es un pigmento perlado hecho con mica natural recubierta con óxidos metálicos\. Da acabados bright, nacarados o metálicos, como los de una perla o metal precioso\./gu, 'AD-313 is a pearlescent pigment made from natural mica coated with metallic oxides. It creates glossy, pearlescent, or metallic finishes like those of a pearl or precious metal.')
    .replace(/Se incorpora a las resins plásticas para lograr efectos visuales de lujo\./gu, 'It is incorporated into plastic resins to achieve premium visual effects.')
    .replace(/Versatilidad: funciona con processs como injection, extrusion and blow molding/gu, 'Versatility: it works with processes such as injection, extrusion, and blow molding')
    .replace(/Verifica que la resin base sea compatible para conservar el acabado óptimo\./gu, 'Verify that the base resin is compatible to preserve the optimal finish.')
    .replace(/<strong ?>(injection)<\/strong ?>, <strong ?>(extrusion)<\/strong ?> <strong ?>y blow molding\.?<\/strong ?>/gu, '<strong>$1</strong>, <strong>$2</strong>, and <strong>blow molding.</strong>')
    .replace(/Agitar el envase de forma vigopink durante 10 segundos para mezclar la emulsión\./gu, 'Shake the container vigorously for 10 seconds to mix the emulsion.')
    .replace(/Agitar vigopinkmente hasta <strong ?>(homogeneizar la emulsión)<\/strong ?>\./gu, 'Shake vigorously until <strong>the emulsion is homogeneous</strong>.')
    .replace(/Recomendado specialmente para mejorar propiedades/gu, 'Recommended especially to improve properties')
    .replace(/Very good: mejora flujo y dispersión de cargas\/pigmentos/gu, 'Very good: improves flow and filler/pigment dispersion')
    .replace(/ideal para applications que exigen transparencia, estética y un rendimiento técnico excepcional\./gu, 'ideal for applications that demand transparency, aesthetics, and exceptional technical performance.')
    .replace(/This masterbatch color concentrate, is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, that provides a blue, ideal para applications donde se utilizan resins plásticas recycleds, con cargas de carbonatos, color white o blue\./gu, 'This masterbatch color concentrate is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, ideal for applications that use recycled plastic resins with carbonate fillers and white or blue base color.')
    .replace(/This masterbatch color concentrate, is formulated with a unique combination of pigmentos orgánicos y cargas minerales, that provides a black, ideal for /gu, 'This masterbatch color concentrate is formulated with a unique combination of organic pigments and mineral fillers, providing black, ideal for ')
    .replace(/AD-313 es un pigmento perlado hecho con mica natural recubierta con óxidos metálicos\. Da acabados bright, nacarados o metálicos, como los de una perla o metal precioso\./gu, 'AD-313 is a pearlescent pigment made from natural mica coated with metallic oxides. It creates glossy, pearlescent, or metallic finishes like those of a pearl or precious metal.')
    .replace(/0\.5 % \(5 g por kg de resin\)/gu, '0.5% (5 g per kg of resin)')
    .replace(/Buena, specialmente mejora desmoldeo y acabado/gu, 'Good, especially for improving release and finish')
    .replace(/Otras resins/gu, 'Other resins')
    .replace(/Extrusion de film, perfiles/gu, 'Film and profile extrusion')
    .replace(/Moldeo por injection/gu, 'Injection molding')
    .replace(/Compensa pérdidas de lubricidad en material reciclado/gu, 'Compensates for lubricity loss in recycled material')
    .replace(/Compuesto auxiliar para limunit de maquinaria en la industria del plástico/gu, 'Auxiliary compound for cleaning machinery in the plastics industry')
    .replace(/El <strong ?>(AD-318 Purga)<\/strong ?> es un compuesto auxiliar diseñado para limpiar equipos de <strong ?>(injection, extrusion and blow molding)<\/strong ?> en la industria del plástico\./gu, '<strong>$1</strong> is an auxiliary compound designed to clean <strong>$2</strong> equipment in the plastics industry.')
    .replace(/Su formulación ayuda a eliminar residuos de polímeros, colores o impurezas que se acumulan durante la producción, asegurando una transición limpia y eficiente entre materiales o colores\./gu, 'Its formulation helps remove polymer residues, colors, or impurities that accumulate during production, ensuring a clean and efficient transition between materials or colors.')
    .replace(/¿Para qué sirven las purgas\?/gu, 'What are purging compounds used for?')
    .replace(/Reducir el tiempo de inactividad:/gu, 'Reduce downtime:')
    .replace(/Prevenir la contaminación:/gu, 'Prevent contamination:')
    .replace(/Eliminar la carbonización:/gu, 'Remove carbon buildup:')
    .replace(/Disminuir desperdicio:/gu, 'Reduce waste:')
    .replace(/Mejorar la calidad del producto:/gu, 'Improve product quality:')
    .replace(/Prolongar la vida útil del equipo:/gu, 'Extend equipment service life:')
    .replace(/Limpian rápidamente el equipo durante los cambios de color o material, sin necesidad de desmontajes prolongados\./gu, 'They quickly clean the equipment during color or material changes without requiring lengthy disassembly.')
    .replace(/Evitan que restos del material anterior afecten la siguiente producción\. Specialmente útil al cambiar de plásticos darks a lights\./gu, 'They prevent residue from the previous material from affecting the next production run. Especially useful when switching from dark plastics to light ones.')
    .replace(/Remueven material degradado o “puntos blacks” adheridos en el husillo y barril, previniendo defectos en las units\./gu, 'They remove degraded material or "black specks" stuck to the screw and barrel, preventing defects in the parts.')
    .replace(/Al limpiar de forma más rápida y eficiente, se reduce la cantidad de material perdido durante la transición\./gu, 'By cleaning faster and more efficiently, they reduce the amount of material lost during transition.')
    .replace(/Permiten obtener units con acabados limpios y uniformes, libres de manchas, rayas o impurezas\./gu, 'They make it possible to obtain parts with clean, uniform finishes, free of stains, streaks, or impurities.')
    .replace(/Mantienen el husillo, el barril y las zonas de alimentación en mejores condiciones, evitando acumulaciones dañinas\./gu, 'They keep the screw, barrel, and feed zones in better condition by preventing harmful buildup.')
    .replace(/Asegúrate de que el equipo esté completamente vacío, sin material en su interior\./gu, 'Make sure the equipment is completely empty, with no material inside.')
    .replace(/Limpia la <strong ?>(zona de alimentación)<\/strong ?> para retirar cualquier residuo previo\./gu, 'Clean the <strong>$1</strong> to remove any previous residue.')
    .replace(/<strong ?>(Agrega la purga gradualmente y de forma directa)<\/strong ?> sobre el sistema de alimentación\./gu, '<strong>Add the purge</strong> into the feed system gradually and directly.')
    .replace(/Enciende el equipo para iniciar la <strong ?>(expulsión del compuesto de purga)<\/strong ?>\./gu, 'Turn on the equipment to begin the <strong>$1</strong>.')
    .replace(/Repite el process según sea necesario hasta obtener una limunit completa\./gu, 'Repeat the process as needed until complete cleaning is achieved.')
    .replace(/<strong ?>(zona de alimentación)<\/strong ?>/gu, '<strong>feed zone</strong>')
    .replace(/<strong ?>(Agrega la purga gradualmente y de forma directa)<\/strong ?>/gu, '<strong>Add the purge gradually and directly</strong>')
    .replace(/<strong ?>(expulsión del compuesto de purga)<\/strong ?>/gu, '<strong>expulsion of the purging compound</strong>')
    .replace(/Recomendaciones de uso/gu, 'Usage recommendations')
    .replace(/No utilices el equipo en frío\./gu, 'Do not operate the equipment cold.')
    .replace(/Asegúrate de que la temperatura de procesamiento sea la adecuada\./gu, 'Make sure the processing temperature is appropriate.')
    .replace(/No mezcles<\/strong> este producto con otras resins plásticas ni con otras purgas; úsalo de manera directa\./gu, 'Do not mix</strong> this product with other plastic resins or other purging compounds; use it directly.')
    .replace(/No dejes el material reposando<\/strong> dentro del equipo una vez aplicada la purga\./gu, 'Do not leave the material resting</strong> inside the equipment once the purge has been applied.')
    .replace(/No modifiques los parámetros de process<\/strong> del equipo durante la application\./gu, 'Do not modify the process parameters</strong> of the equipment during application.')
    .replace(/Utiliza <strong ?>(la misma temperatura)<\/strong ?> de procesamiento que empleas con la resin que deseas purgar\./gu, 'Use <strong>the same processing temperature</strong> you use with the resin you want to purge.')
    .replace(/Warning important/gu, 'Important warning')
    .replace(/Esta purga, en <strong ?>(presentación masterbatch)<\/strong ?>, <strong ?>(no debe utilizarse en processs de injection con colada caliente)<\/strong ?>, ya que puede <strong ?>(adherirse dentro de los canales del molde)<\/strong ?>, afectando el flujo del material y complicando la limunit posterior\./gu, 'This purge, in <strong>$1</strong>, <strong>$2</strong>, as it may <strong>$3</strong>, affecting material flow and complicating subsequent cleaning.')
    .replace(/Tampoco se recomienda para <strong ?>(resins plásticas PET)<\/strong ?>, pues en algunos casos puede <strong ?>(provocar contaminación o defectos superficiales)<\/strong ?> en las units finales\./gu, 'It is also not recommended for <strong>$1</strong>, since in some cases it may <strong>$2</strong> in the final parts.')
    .replace(/<strong ?>(la misma temperatura)<\/strong ?>/gu, '<strong>the same</strong>')
    .replace(/<strong ?>(presentación masterbatch)<\/strong ?>/gu, '<strong>masterbatch presentation</strong>')
    .replace(/<strong ?>(no debe utilizarse en processs de injection con colada caliente)<\/strong ?>/gu, '<strong>should not be used in hot-runner injection processes</strong>')
    .replace(/<strong ?>(adherirse dentro de los canales del molde)<\/strong ?>/gu, '<strong>adhere inside the mold channels</strong>')
    .replace(/<strong ?>(resins plásticas PET)<\/strong ?>/gu, '<strong>PET plastic resins</strong>')
    .replace(/<strong ?>(provocar contaminación o defectos superficiales)<\/strong ?>/gu, '<strong>cause contamination or surface defects</strong>')
    .replace(/\bExtrusion \(evaluar\)\./gu, 'Extrusion (evaluate).')
    .replace(/\bBlow Molding \(evaluar\)\./gu, 'Blow molding (evaluate).')
    .replace(/\bOtros \(hacer pruebas de migración\)/gu, 'Others (run migration tests)')
    .replace(/\bNo utilizar en resinas virgines, debido a la migración que presenta\./gu, 'Do not use in virgin resins due to its migration behavior.')
    .replace(/\bNo utilizar en resins virgines, debido a la migración que presenta\./gu, 'Do not use in virgin resins due to its migration behavior.')
    .replace(/\bno utilizar en resinas virgenes\./gu, 'do not use in virgin resins.')
    .replace(/\bbrights\b/gu, 'bright')
    .replace(/\bsuggested %/gu, 'Suggested %')
    .replace(/\bcm de distancia\./gu, 'cm away.')
    .replace(/estimated usage %/gu, 'Estimated usage %')
    .replace(/Información Important/gu, 'Important Information')
    .replace(/<strong ?>(Transparencia)<\/strong ?>: un uso excesivo puede dejar la superficie bright o grasosa\. Si eso ocurre, limpia la unit con un paño seco de microfibra\./gu, '<strong>Transparency</strong>: excessive use can leave the surface shiny or greasy. If that happens, clean the part with a dry microfiber cloth.')
    .replace(/Open view ([0-9]+) de /gu, 'Open view $1 of ')
    .replace(/This masterbatch color concentrate, is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, that provides a blue, ideal para aplicaciones donde se utilizan resinas plásticas recycleds, con cargas de carbonatos, color white o blue\./gu, 'This masterbatch color concentrate is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, ideal for applications that use recycled plastic resins with carbonate fillers and white or blue base color.')
    .replace(/This masterbatch color concentrate, is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, that provides a red, ideal para aplicaciones donde se utilizan resinas plásticas recycleds, con cargas de carbonatos, color white o blue\./gu, 'This masterbatch color concentrate is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, ideal for applications that use recycled plastic resins with carbonate fillers and white or blue base color.');
}

const PHRASE_REPLACEMENTS = [
  ['Hola%20AGAMA%2C%20me%20interesa%20el%20producto%3A%20', 'Hello%20AGAMA%2C%20I%20am%20interested%20in%20the%20product%3A%20'],
  ['Compatibilidad y Procesamiento', 'Compatibility and Processing'],
  ['Galería del producto', 'Product gallery'],
  ['Abrir vista', 'Open view'],
  ['vista', 'view'],
  ['Uso principal', 'Primary use'],
  ['¿Para qué sirve?', 'What is it for?'],
  ['¿Qué es?', 'What is it?'],
  ['¿Para qué se usa?', 'What is it used for?'],
  ['Cómo se usa', 'How to use it'],
  ['Cómo usarlo', 'How to use it'],
  ['Cómo actúa durante el moldeo', 'How it works during molding'],
  ['Advertencias importantes', 'Important warnings'],
  ['Instrucciones de uso', 'Instructions for use'],
  ['Seguridad y compatibilidad', 'Safety and compatibility'],
  ['Aplicaciones comunes', 'Common applications'],
  ['Aplicaciones típicas', 'Typical applications'],
  ['Aplicaciones', 'Applications'],
  ['Aplicación', 'Application'],
  ['Dosis típica', 'Typical dosage'],
  ['Beneficios destacados', 'Highlighted benefits'],
  ['Beneficios principales', 'Main benefits'],
  ['Consideraciones importantes', 'Important considerations'],
  ['Diferencias con el AD-305', 'Differences from AD-305'],
  ['¿Interfiere con procesos de decoración?', 'Does it interfere with decorating processes?'],
  ['Importante', 'Important'],
  ['¿Cómo funciona?', 'How does it work?'],
  ['Qué hace', 'What it does'],
  ['Uso principal del producto', 'Primary product use'],
  ['Primary use del producto', 'Primary product use'],
  ['Usos Principal', 'Primary uses'],
  ['Ventajas y beneficios', 'Advantages and benefits'],
  ['Temperaturas de procesamiento', 'Processing temperatures'],
  ['Resinas plásticas donde puede usarse', 'Plastic resins where it can be used'],
  ['Procesos de producción donde usarse', 'Production processes where it can be used'],
  ['Resinas compatibles:', 'Compatible resins:'],
  ['Resinas compatibles', 'Compatible resins'],
  ['Resinas a evaluar:', 'Resins to evaluate:'],
  ['Resinas a evaluar', 'Resins to evaluate'],
  ['Procesos de moldeo sugeridos:', 'Suggested molding processes:'],
  ['Procesos de moldeo sugeridos', 'Suggested molding processes'],
  ['Procesos de moldeo a evaluar:', 'Molding processes to evaluate:'],
  ['Procesos de moldeo a evaluar', 'Molding processes to evaluate'],
  ['Temperatura de proceso recomendada:', 'Recommended processing temperature:'],
  ['Temperatura de proceso recomendada', 'Recommended processing temperature'],
  ['Tiempos de mezcla sugeridos:', 'Suggested mixing times:'],
  ['Tiempos de mezcla sugeridos', 'Suggested mixing times'],
  ['procesos de moldeo', 'molding processes'],
  ['Dosificación Recomendada', 'Recommended dosage'],
  ['Dosificación recomendada', 'Recommended dosage'],
  ['Dosificación sugerida', 'Suggested dosage'],
  ['Cantidad sugerida', 'Suggested amount'],
  ['Beneficios Clave', 'Key benefits'],
  ['Información Importante', 'Important information'],
  ['Venta Mímina', 'Minimum order'],
  ['Venta Mínina', 'Minimum order'],
  ['Venta Mínima', 'Minimum order'],
  ['Presentación y Disponibilidad', 'Packaging and availability'],
  ['Presentación:', 'Packaging:'],
  ['Disponibilidad:', 'Availability:'],
  ['Distribuidores acreditados:', 'Authorized distributors:'],
  ['Tienda en línea:', 'Online store:'],
  ['Ventas corporativas:', 'Corporate sales:'],
  ['Distribuidores acreditados', 'Authorized distributors'],
  ['Tienda en línea', 'Online store'],
  ['Ventas corporativas', 'Corporate sales'],
  ['A partir de', 'Starting from'],
  ['desde', 'from'],
  ['Bolsas de 1 Kg', '1 kg bags'],
  ['Cajas de 25 Kg', '25 kg boxes'],
  ['Sacos de 25 Kg', '25 kg sacks'],
  ['Bote de aerosol', 'Aerosol can'],
  ['Cajas de 24 piezas', 'Boxes of 24 units'],
  ['Tipo de resina', 'Resin type'],
  ['Proceso', 'Process'],
  ['% sugerido', 'Suggested %'],
  ['% estimado de uso', 'Estimated usage %'],
  ['Vírgen', 'Virgin'],
  ['Reciclada', 'Recycled'],
  ['Este concentrado de color en polvo', 'This powdered color concentrate'],
  ['Este concentrado de color en masterbatch', 'This masterbatch color concentrate'],
  ['Este concentrado de aditivo en masterbatch', 'This masterbatch additive concentrate'],
  ['This masterbatch additive concentrate, está formulado con una combinación única mineral compounds and additives para mejorar las propiedades de antibloqueo y deslizamiento en la fabricación de films.', 'This masterbatch additive concentrate is formulated with a unique combination of mineral compounds and additives to improve antiblocking and slip properties in film manufacturing.'],
  ['está formulado con una combinación única de', 'is formulated with a unique combination of'],
  ['pigmentos orgánicos, inorgánicos y cargas minerales', 'organic and inorganic pigments plus mineral fillers'],
  ['compuestos minerales y aditivos', 'mineral compounds and additives'],
  ['que proporcionan un tono', 'that provides a'],
  ['tono vibrante', 'vibrant tone'],
  ['ideal para aplicaciones que exigen visibilidad, estética y un rendimiento técnico excepcional.', 'ideal for applications that demand visibility, aesthetics, and exceptional technical performance.'],
  ['ideal para applications que exigen visibilidad, estética y un rendimiento técnico excepcional.', 'ideal for applications that demand visibility, aesthetics, and exceptional technical performance.'],
  ['ideal para aplicaciones que exigen transparencia, estética y un rendimiento técnico excepcional.', 'ideal for applications that demand transparency, aesthetics, and exceptional technical performance.'],
  ['ideal para applications que exigen transparencia, estética y un rendimiento técnico excepcional.', 'ideal for applications that demand transparency, aesthetics, and exceptional technical performance.'],
  ['que proporcionan un', 'that provide a'],
  ['es perfecto para procesos de moldeo como', 'is ideal for molding processes such as'],
  ['Su formulación permite una integración fluida con resinas vírgenes y recicladas', 'Its formulation integrates smoothly with virgin and recycled resins'],
  ['Su formulación permite una integración fluida con resins recycleds, asegurando resultados de alta calidad.', 'Its formulation integrates smoothly with recycled resins, ensuring high-quality results.'],
  ['Su formulación permite una integración fluida con resins <strong >recycleds</strong>, ensuring high-quality results.', 'Its formulation integrates smoothly with <strong>recycled resins</strong>, ensuring high-quality results.'],
  ['asegurando resultados de alta calidad.', 'ensuring high-quality results.'],
  ['Su formulación permite una integración fluida con resinas vírgenes y recicladas, asegurando resultados de alta calidad.', 'Its formulation integrates smoothly with virgin and recycled resins, ensuring high-quality results.'],
  ['No se recomienda para', 'It is not recommended for'],
  ['porque puede presentar mala dispersión en forma de grumos muy acentuados.', 'because it may show poor dispersion with noticeable clumping.'],
  ['Este concentrado de color no cuenta con materiales aprobados por la FDA (Food and Drugs Administration).', 'This color concentrate does not include materials approved by the FDA (Food and Drug Administration).'],
  ['Si requieres productos que cumplan con este requisito, no dudes en contáctarnos.', 'If you need products that meet this requirement, please contact us.'],
  ['Si requieres productos que cumplan con este requisito, no dudes en contactarnos.', 'If you need products that meet this requirement, please contact us.'],
  ['Puede ser utilizado en una gran cantidad de resinas plásticas como:', 'It can be used with a wide range of plastic resins such as:'],
  ['Se incorpora uniformemente a la resina plástica durante su fabricación.', 'It is incorporated uniformly into the plastic resin during production.'],
  ['Al exponerse al sol', 'When exposed to sunlight'],
  ['neutraliza radicales libres', 'it neutralizes free radicals'],
  ['y detiene la fotodegradación desde sus primeros pasos.', 'and stops photodegradation from its earliest stages.'],
  ['Al exponerse al sol, neutraliza radicales libres y detiene la fotodegradación desde sus primeros pasos.', 'When exposed to sunlight, it neutralizes free radicals and stops photodegradation from its earliest stages.'],
  ['Su función principal es cuidar la estructura del polímero y prolongar la vida útil de las piezas.', 'Its main function is to protect the polymer structure and extend the service life of the parts.'],
  ['No protege el color, aunque ayuda a que los productos mantengan mejor su apariencia exterior.', 'It does not protect color directly, although it helps products maintain a better exterior appearance.'],
  ['Protege contra el amarillamiento, el desgaste del brillo y la fragilidad por exposición solar.', 'It protects against yellowing, gloss loss, and brittleness caused by sun exposure.'],
  ['Se “recarga” al capturar radicales libres continuamente.', 'It effectively "recharges" itself by continuously capturing free radicals.'],
  ['Mejora la duración y la apariencia del plástico.', 'It improves the durability and appearance of the plastic.'],
  ['Alta estabilidad térmica durante el procesamiento.', 'High thermal stability during processing.'],
  ['Compatible con absorbentes UV para una protección extra.', 'Compatible with UV absorbers for extra protection.'],
  ['En general se recomendamos usar entre', 'In general, we recommend using between'],
  ['Poder excepcional de antibloqueo:', 'Exceptional antiblocking power:'],
  ['para una apertura de bolsa más fácil.', 'for easier bag opening.'],
  ['Dispersión uniforme', 'Uniform dispersion'],
  ['que garantiza una mejor distribución de los aditivos.', 'that ensures better additive distribution.'],
  ['Transparencia media:', 'Medium transparency:'],
  ['para bolsas de uso general.', 'for general-purpose bags.'],
  ['Alto poder colorante:', 'High coloring strength:'],
  ['logra tono vivo con menor dosificación.', 'achieves a vivid tone with lower dosage.'],
  ['logra un tono traslúcido con menor dosificación.', 'achieves a translucent tone with lower dosage.'],
  ['Dispersión uniforme:', 'Uniform dispersion:'],
  ['color consistente, menores vetas y puntos.', 'consistent color with fewer streaks and specks.'],
  ['Estabilidad térmica:', 'Thermal stability:'],
  ['apto para procesos a temperaturas estándar.', 'suitable for standard-temperature processes.'],
  ['Baja migración:', 'Low migration:'],
  ['Alta migración:', 'High migration:'],
  ['adecuado para artículos técnicos y de uso general.', 'suitable for technical and general-purpose articles.'],
  ['no utilizar en resinas virgenes.', 'do not use in virgin resins.'],
  ['Posible migración:', 'Possible migration:'],
  ['en polietilenos y polipropilenos.', 'in polyethylenes and polypropylenes.'],
  ['Mejora la dureza de las resinas', 'Improves resin hardness'],
  ['Proporciona mayor rigidez', 'Provides greater stiffness'],
  ['Ayuda a reducir los costos de producción al sustituir parte del polímero', 'Helps reduce production costs by replacing part of the polymer'],
  ['El carbonato de calcio en masterbatch se usa en plásticos y es compatible con la mayoría de los polímeros. Mejora la rigidez y la dureza de las piezas.', 'Calcium carbonate masterbatch is used in plastics and is compatible with most polymers. It improves the stiffness and hardness of finished parts.'],
  ['Asegurar buena dispersión del polvo para evitar grumos.', 'Ensure good powder dispersion to avoid clumping.'],
  ['Verifica que el tamaño de partícula sea adecuado para la resina que usas.', 'Verify that the particle size is suitable for the resin you are using.'],
  ['Dosificación: entre', 'Dosage: between'],
  ['10 a 100 gramos', '10 to 100 grams'],
  ['20 y 15 gramos', '20 to 15 grams'],
  ['gramos por kilo de resina', 'grams per kilogram of resin'],
  ['gramos', 'grams'],
  ['kilogramo', 'kilogram'],
  ['pieza', 'unit'],
  ['piezas', 'units'],
  ['máximo 7 minutos', 'maximum 7 minutes'],
  ['en extrusión;', 'in extrusion;'],
  ['en inyección y soplado', 'in injection and blow molding'],
  ['dependiendo aplicación', 'depending on the application'],
  ['para mejorar las propiedades de antibloqueo y deslizamiento en la fabricación de películas.', 'to improve antiblocking and slip properties in film manufacturing.'],
  ['para mejorar las propiedades de antibloqueo y deslizamiento en la fabricación de films.', 'to improve antiblocking and slip properties in film manufacturing.'],
  ['Se usa en plásticos', 'It is used in plastics'],
  ['protege plásticos de la luz solar', 'protects plastics from sunlight'],
  ['Impide que el polímero se degrade cuando está al aire libre.', 'It helps prevent the polymer from degrading outdoors.'],
  ['AD-310 es un aerosol desmoldante formulado con aceites y emulsiones de silicón de alta pureza.', 'AD-310 is an aerosol mold-release agent formulated with high-purity silicone oils and emulsions.'],
  ['AD-312 limpia moldes interna y externamente. Elimina grasa, aceites y óxidos que se forman en las superficies metálicas con el uso o desgaste natural.', 'AD-312 cleans molds internally and externally. It removes grease, oils, and oxides that form on metal surfaces through use and natural wear.'],
  ['AD-309 es un desmoldante de acción interna presentado en microesfera. Está hecho con ácidos grasos de alta pureza. Funciona igual que su versión en polvo (AD-305), pero cambia su forma física.', 'AD-309 is an internal mold-release additive in microsphere form. It is made from high-purity fatty acids and works like its powder version (AD-305), but with a different physical format.'],
  ['Está hecho con ácidos grasos de alta pureza.', 'It is made from high-purity fatty acids.'],
  ['AD-313 es un pigmento perlado hecho con mica natural recubierta. Da acabados brillantes, nacarados o metálicos, como los de una perla o metal precioso.', 'AD-313 is a pearlescent pigment made from coated natural mica. It creates glossy, pearlescent, or metallic finishes similar to pearl or precious metal.'],
  ['AD-313 es un pigmento perlado hecho con mica natural recubierta con óxidos metálicos. Da acabados bright, nacarados o metálicos, como los de una perla o metal precioso.', 'AD-313 is a pearlescent pigment made from natural mica coated with metallic oxides. It creates glossy, pearlescent, or metallic finishes like those of a pearl or precious metal.'],
  ['AD-304 es un protector UV en microesferas que protege plásticos de la luz solar.', 'AD-304 is a UV protector in microsphere form that protects plastics from sunlight.'],
  ['Este aditivo es utilizado en plásticos es como agente espumante porque al descomponerse durante el procesamiento, libera gases que crean una estructura celular en el material plástico, lo que ayuda a reducir ligeramente su densidad.', 'This additive is used in plastics as a blowing agent because, when it decomposes during processing, it releases gases that create a cellular structure in the plastic material, helping slightly reduce its density.'],
  ['Este aditivo es utilizado en plásticos es como agente espumante', 'This additive is used in plastics as a blowing agent'],
  ['Temperatura recomendada', 'Recommended temperature'],
  ['NB SERIES es un aditivo formulado con una mezcla de ceras y estearatos de alta pureza, diseñado para actuar como lubricante interno y externo en processs', 'NB SERIES is an additive formulated with a blend of high-purity waxes and stearates, designed to act as an internal and external lubricant in processes'],
  ['Funciones principales', 'Main functions'],
  ['Advertencia', 'Warning'],
  ['Resina', 'Resin'],
  ['Compatibilidad típica', 'Typical compatibility'],
  ['Muy buena', 'Very good'],
  ['Buena, specialmente mejora desmoldeo y acabado', 'Good, especially for improving release and finish'],
  ['Resinas recycleds', 'Recycled resins'],
  ['Recomendado para mejorar propiedades', 'Recommended to improve properties'],
  ['Otras resinas', 'Other resins'],
  ['Hacer pruebas de compatibilidad', 'Run compatibility tests'],
  ['Beneficio principal', 'Main benefit'],
  ['Extrusion de film, perfiles', 'Film and profile extrusion'],
  ['Mejora el flujo y la dispersión de pigmentos/cargas', 'Improves flow and pigment/filler dispersion'],
  ['Moldeo por injection', 'Injection molding'],
  ['Mejora acabado exterior y reduce fricción interna', 'Improves exterior finish and reduces internal friction'],
  ['Masterbatch / concentrados de color', 'Masterbatch / color concentrates'],
  ['Actúa como aditivo auxiliar para mejorar dispersión', 'Acts as an auxiliary additive to improve dispersion'],
  ['Compensa pérdidas de lubricidad en material reciclado', 'Compensates for lubricity loss in recycled material'],
  ['Pesar la dosis recomendada del aditivo.', 'Weigh the recommended additive dosage.'],
  ['Integrarlo al polímero junto con otros aditivos.', 'Incorporate it into the polymer along with other additives.'],
  ['Mezclar de forma homogénea durante 5–7 minutos.', 'Mix evenly for 5–7 minutes.'],
  ['Procesar el material con parámetros habituales, verificando comportamiento.', 'Process the material with standard parameters while verifying performance.'],
  ['Precauciones y consideraciones', 'Precautions and considerations'],
  ['Verificar que la dosis no provoque lubricación excesiva, lo que puede deteriorar propiedades mecánicas o acabado.', 'Verify that the dosage does not cause excessive lubrication, which may impair mechanical properties or finish.'],
  ['En polímeros transparentes, dosis altas pueden generar nubosidad o efecto de “neblina”.', 'In transparent polymers, high dosages may generate haziness or a fogging effect.'],
  ['Almacenar en lugar seco, fresco y bien cerrado para evitar humedad o contaminación.', 'Store in a cool, dry, tightly closed place to avoid moisture or contamination.'],
  ['Precaución', 'Caution'],
  ['Compatibilidad con Lubiwax', 'Compatibility with Lubiwax'],
  ['Muy buena: mejora flujo y dispersión de cargas/pigmentos', 'Very good: improves flow and filler/pigment dispersion'],
  ['Buena: facilita desmoldeo y mejora acabado', 'Good: facilitates release and improves finish'],
  ['Recomendado specialmente para mejorar propiedades', 'Recommended especially to improve properties'],
  ['Versatilidad: funciona con processs como injection, extrusion and blow molding', 'Versatility: it works with processes such as injection, extrusion, and blow molding'],
  ['Resistente a la luz UV y al calor, ideal para exteriores y applications exigentes', 'Resistant to UV light and heat, ideal for outdoor and demanding applications'],
  ['0.5 % (5 g por kg de resina)', '0.5% (5 g per kg of resin)'],
  ['El AD-315 Phenil-O es un aditivo diseñado para mejorar la humectación, dispersión y fijación temporal de pigmentos en polvo o aditivos durante la pigmentación.', 'AD-315 Phenil-O is an additive designed to improve wetting, dispersion, and temporary fixation of powdered pigments or additives during pigmentation.'],
  ['El AD-315 Phenil-O es un aditivo diseñado para mejorar la humectación, dispersión y fijación temporal de pigmentos en polvo o aditivos durante la pigmen', 'AD-315 Phenil-O is an additive designed to improve wetting, dispersion, and temporary fixation of powdered pigments or additives during pigmen'],
  ['El <strong >AD-315 Phenil-O</strong> es un aditivo diseñado para <strong >mejorar la humectación, dispersión y fijación temporal de pigmentos</strong> en polvo o aditivos durante la pigmentación.', '<strong>AD-315 Phenil-O</strong> is an additive designed to <strong>improve the wetting, dispersion, and temporary fixation of pigments</strong> in powder additives during pigmentation.'],
  ['Actúa directamente sobre el polímero antes del process de fusión o moldeo, asegurando una distribución uniforme del color y evitando la formación de grumos o aglomeraciones.', 'It acts directly on the polymer before the melting or molding process, ensuring uniform color distribution and preventing lumps or agglomerates.'],
  ['Su función principal es <strong >“fijar” temporalmente las partículas de pigmento y aditivos</strong> durante la etapa de mezcla, evitando que se reagrupen antes de fundirse con la resina.', 'Its main function is to <strong>temporarily "fix" pigment and additive particles</strong> during the mixing stage, preventing them from regrouping before melting into the resin.'],
  ['Esto resulta specialmente útil al trabajar con <strong >resinas recuperadas o recycleds</strong>, donde las formas irregulares de los pellets dificultan una coloración uniforme.', 'This is especially useful when working with <strong>recovered or recycled resins</strong>, where irregular pellet shapes make uniform coloration more difficult.'],
  ['Esto resulta specialmente útil al trabajar con <strong >resins recuperadas o recycleds</strong>, donde las formas irregulares de los pellets dificultan una coloración uniforme.', 'This is especially useful when working with <strong>recovered or recycled resins</strong>, where irregular pellet shapes make uniform coloration more difficult.'],
  ['Ventajas de su uso', 'Benefits of its use'],
  ['Humectación mejorada:', 'Improved wetting:'],
  ['Dispersión eficiente:', 'Efficient dispersion:'],
  ['Estabilización del color:', 'Color stabilization:'],
  ['Mejor apariencia final:', 'Better final appearance:'],
  ['Agrega el fijador', 'Add the fixative'],
  ['No añadir simultáneamente pigmentos, masterbatch ni otros aditivos en este paso inicial.', 'Do not add pigments, masterbatch, or other additives at the same time in this initial step.'],
  ['Dosifica <strong >2 grams de aditivo por cada kilogram de resina</strong>, o bien <strong >una tapa de producto por cada 25 kg de resina</strong>.', 'Dose <strong>2 grams of additive per kilogram of resin</strong>, or <strong>one capful of product per 25 kg of resin</strong>.'],
  ['Mezcla durante <strong >5 minutos</strong> en el equipo de pigmentación hasta obtener una distribución uniforme.', 'Mix for <strong>5 minutes</strong> in the pigmentation equipment until uniform distribution is achieved.'],
  ['Añade posteriormente el pigmento, masterbatch o aditivos requeridos.', 'Then add the required pigment, masterbatch, or additives.'],
  ['Mezcla nuevamente durante <strong >no más de 7 minutos</strong> para finalizar la preparación.', 'Mix again for <strong>no more than 7 minutes</strong> to complete the preparation.'],
  ['Recomendaciones generales', 'General recommendations'],
  ['Mantén el envase cerrado y en un lugar fresco, seco y alejado de fuentes de calor.', 'Keep the container closed and in a cool, dry place away from heat sources.'],
  ['Evita mezclarlo con otros agentes de humectación o dispersión para no alterar su desempeño.', 'Avoid mixing it with other wetting or dispersing agents so as not to alter its performance.'],
  ['No requiere modificaciones en la temperatura del process.', 'It does not require changes to the process temperature.'],
  ['Puede emplearse en líneas de producción de <strong >injection, extrusion, blow molding o peletizado</strong>.', 'It can be used in production lines for <strong>injection, extrusion, blow molding, or pelletizing</strong>.'],
  ['Puede emplearse en líneas de producción de <strong >injection, extrusion, blow molding o peletizado</strong>.', 'It can be used in production lines for <strong>injection, extrusion, blow molding, or pelletizing</strong>.'],
  ['Su función principal es <strong >“fijar” temporalmente las partículas de pigmento y aditivos</strong> durante la etapa de mezcla, evitando que se reagrupen antes de fundirse con la resin.', 'Its main function is to <strong>temporarily "fix" pigment and additive particles</strong> during the mixing stage, preventing them from regrouping before melting into the resin.'],
  ['Esto resulta specialmente útil al trabajar con <strong >resins recuperadas o recycleds</strong>, donde las formas irregulares de los pellets dificultan una coloración uniforme.', 'This is especially useful when working with <strong>recovered or recycled resins</strong>, where irregular pellet shapes make uniform coloration more difficult.'],
  ['<strong >Improved wetting:</strong>Cubre de manera uniforme la superficie del polímero con pigmentos y aditivos en polvo, desplazando el aire atrapado entre las partículas y favoreciendo una mezcla más homogénea.', '<strong>Improved wetting:</strong> It uniformly coats the polymer surface with powdered pigments and additives, displacing trapped air between particles and promoting a more homogeneous mixture.'],
  ['<strong >Efficient dispersion:</strong> Durante la mezcla mecánica, ayuda a romper las aglomeraciones del pigmento, actuando como lubricante para lograr partículas más finas y mejor distribución del color.', '<strong>Efficient dispersion:</strong> During mechanical mixing, it helps break up pigment agglomerations, acting as a lubricant to achieve finer particles and better color distribution.'],
  ['<strong >Color stabilization: </strong>Favorece la integración estable del pigmento sobre la superficie del polímero, reduciendo la posibilidad de aglomeración o desprendimiento durante el process.', '<strong>Color stabilization:</strong> It promotes stable integration of the pigment on the polymer surface, reducing the possibility of agglomeration or detachment during processing.'],
  ['<strong >Better final appearance:</strong> Al mejorar la adhesión del pigmento sobre el pellet, el color se mantiene constante durante el moldeo. Ideal para <strong >resins recycleds</strong>, que suelen presentar irregularidades físicas o variaciones en superficie.', '<strong>Better final appearance:</strong> By improving pigment adhesion on the pellet, the color remains consistent during molding. Ideal for <strong>recycled resins</strong>, which often show physical irregularities or surface variations.'],
  ['<strong >Add the fixative</strong> únicamente junto con el polímero base.', '<strong>Add the fixative</strong> only together with the base polymer.'],
  ['Dosifica <strong >2 grams de aditivo por cada kilogram de resin</strong>, o bien <strong >una tapa de producto por cada 25 kg de resin</strong>.', 'Dose <strong>2 grams of additive per kilogram of resin</strong>, or <strong>one capful of product per 25 kg of resin</strong>.'],
  ['litro', 'liter'],
  ['Envases de 1 Lt', '1 L containers'],
  ['AD-316 W-Slip es un desmoldante base agua formulado con derivados de silicón y emulsificantes que crean una film de liberación entre el molde y el plástico fundido.', 'AD-316 W-Slip is a water-based mold-release agent formulated with silicone derivatives and emulsifiers that create a release film between the mold and the molten plastic.'],
  ['AD-316 W-Slip es un desmoldante base agua formulado con derivados de silicón y emulsificantes que crean una film de liberación entre el molde y el p', 'AD-316 W-Slip is a water-based mold-release agent formulated with silicone derivatives and emulsifiers that create a release film between the mold and the p'],
  ['AD-316 W-Slip es un desmoldante base agua formulado con derivados de silicón y emulsificantes que crean una film de liberación entre el molde y el p', 'AD-316 W-Slip is a water-based mold-release agent formulated with silicone derivatives and emulsifiers that create a release film between the mold and the p'],
  ['Está diseñado para processs de <strong >rotomolding</strong> donde se requiere una separación limpia, rápida y sin dañar las units o el molde.', 'It is designed for <strong>rotomolding</strong> processes where clean, fast separation is required without damaging the parts or the mold.'],
  ['¿Por qué usar los desmoldantes?', 'Why use mold-release agents?'],
  ['Facilitar la extracción:', 'Easier demolding:'],
  ['Proteger el molde:', 'Protect the mold:'],
  ['Mejorar el acabado superficial:', 'Improve surface finish:'],
  ['Aumentar la productividad:', 'Increase productivity:'],
  ['Permitir geometrías complejas:', 'Allow complex geometries:'],
  ['Instrucciones de dilución con agua', 'Water dilution instructions'],
  ['Agitar el envase de forma vigopink durante 10 segundos para mezclar la emulsión.', 'Shake the container vigorously for 10 seconds to mix the emulsion.'],
  ['Mezclar con <strong >4 litros de agua</strong>, preferentemente filtrada.', 'Mix with <strong>4 liters of water</strong>, preferably filtered.'],
  ['Agitar vigopinkmente hasta <strong >homogeneizar la emulsión</strong>.', 'Shake vigorously until <strong>the emulsion is homogeneous</strong>.'],
  ['Agitar el envase de forma vigopink durante 10 segundos para mezclar la emulsión.', 'Shake the container vigorously for 10 seconds to mix the emulsion.'],
  ['Agitar vigopinkmente hasta <strong >homogeneizar la emulsión</strong>.', 'Shake vigorously until <strong>the emulsion is homogeneous</strong>.'],
  ['El desmoldante debe <strong >utilizarse en un periodo no mayor a 1 mes</strong> después de su preparación.', 'The mold-release agent should <strong>be used within no more than 1 month</strong> after preparation.'],
  ['Colocar el desmoldante en un <strong >atomizador</strong>.', 'Place the mold-release agent in a <strong>sprayer</strong>.'],
  ['Limpiar la superficie del molde donde será aplicado el producto.', 'Clean the mold surface where the product will be applied.'],
  ['Rociar sobre todo el molde a una distancia de <strong >10 a 15 cm</strong>.', 'Spray over the entire mold from a distance of <strong>10 to 15 cm</strong>.'],
  ['<strong >Easier demolding:</strong> Crean una barrera entre el molde caliente y el plástico fundido, evitando que el material se adhiera y permitiendo una extracción rápida y sin daños.', '<strong>Easier demolding:</strong> They create a barrier between the hot mold and the molten plastic, preventing the material from sticking and allowing quick, damage-free removal.'],
  ['<strong >Protect the mold:</strong> Previenen rayaduras, corrosión o esfuerzos mecánicos al retirar units pegadas, prolongando la vida útil del molde.', '<strong>Protect the mold:</strong> They prevent scratches, corrosion, or mechanical stress when removing stuck parts, extending mold life.'],
  ['<strong >Improve surface finish:</strong> Aseguran units con acabado liso y uniforme, sin imperfecciones por separación deficiente.', '<strong>Improve surface finish:</strong> They ensure parts with a smooth, uniform finish, without imperfections caused by poor release.'],
  ['<strong >Increase productivity:</strong> Un desmolde eficiente reduce los tiempos de ciclo.', '<strong>Increase productivity:</strong> Efficient release reduces cycle times.'],
  ['<strong >Allow complex geometries:</strong> En moldes con orificios o insertos metálicos, el desmoldante garantiza cobertura total incluso en zonas difíciles.', '<strong>Allow complex geometries:</strong> In molds with holes or metallic inserts, the mold-release agent ensures full coverage even in difficult areas.'],
  ['Agitar el envase de forma vigopink durante 10 segundos para mezclar la emulsión.', 'Shake the container vigorously for 10 seconds to mix the emulsion.'],
  ['Mezclar con <strong >4 liters de agua</strong>, preferentemente filtrada.', 'Mix with <strong>4 liters of water</strong>, preferably filtered.'],
  ['Agitar vigopinkmente hasta <strong >homogeneizar la emulsión</strong>.', 'Shake vigorously until <strong>the emulsion is homogeneous</strong>.'],
  ['Se usa para liberar piezas de plástico producidas por', 'It is used to release plastic parts produced by'],
  ['Gracias a sus solventes y propelentes, seca casi de inmediato y permite liberar más piezas por disparo.', 'Thanks to its solvents and propellants, it dries almost immediately and allows more parts to be released per cycle.'],
  ['Agita el envase antes de usar.', 'Shake the container before use.'],
  ['Apunta la boquilla hacia la superficie del molde,', 'Point the nozzle toward the mold surface,'],
  ['Rocia ligeramente.', 'Spray lightly.'],
  ['Rocía ligeramente.', 'Spray lightly.'],
  ['Reaplica cuando lo creas necesario.', 'Reapply as needed.'],
  ['No usar en rotomoldeo', 'Do not use in rotomolding'],
  ['los propelentes son inflamables, y la acumulación de gases y contacte con moldes calientes puede generar riesgo de incendio.', 'the propellants are flammable, and gas buildup in contact with hot molds can create a fire risk.'],
  ['No aplicarlo sobre circuitos electrics o electrónicos en operación', 'Do not apply it on active electrical or electronic circuits'],
  ['No aplicarlo sobre circuitos eléctricos o electrónicos en operación', 'Do not apply it on active electrical or electronic circuits'],
  ['deja una capa grasa que atrae polvo y puede causar fallas o cortocircuitos.', 'it leaves an oily film that attracts dust and may cause failures or short circuits.'],
  ['un uso excesivo puede dejar la superficie bright o grasosa.', 'excessive use can leave the surface shiny or greasy.'],
  ['Si eso ocurre, limpia la pieza con un paño seco de microfibra.', 'If that happens, clean the part with a dry microfiber cloth.'],
  ['no recomendado para piezas que estarán en contacto directo con alimentos o medicamentos, a menos que se verifique que cumple normas regulatorias específicas.', 'not recommended for parts that will be in direct contact with food or medicines unless compliance with specific regulatory standards is verified.'],
  ['En general, no debería afectar serigrafía, tampografía, hot stamping, etiquetado exterior o metalizado.', 'In general, it should not affect screen printing, pad printing, hot stamping, exterior labeling, or metallization.'],
  ['Pero se recomienda hacer pruebas específicas para tu aplicación.', 'However, specific tests are recommended for your application.'],
  ['Se incorpora a las resinas plásticas para lograr efectos visuales de lujo.', 'It is incorporated into plastic resins to achieve premium visual effects.'],
  ['Ideal para productos decorativos, moda, envases de alta gama y artículos que se quieran destacar visualmente.', 'Ideal for decorative products, fashion, premium packaging, and items meant to stand out visually.'],
  ['Proporciona brillo fuerte, estética llamativa y estabilidad frente al calor y la luz.', 'It provides strong luster, eye-catching aesthetics, and stability against heat and light.'],
  ['Carrocerías o detalles automotrices', 'Automotive body parts or trim details'],
  ['Artículos electrónicos decorativos', 'Decorative electronic items'],
  ['Cosméticos de plástico o envases premium', 'Plastic cosmetic parts or premium packaging'],
  ['Elementos decorativos interiores y exteriores', 'Interior and exterior decorative elements'],
  ['Productos plásticos de consumo con acabado de lujo', 'Consumer plastic products with a premium finish'],
  ['Brillo y estética de alta calidad que llama la atención visualmente', 'High-quality shine and aesthetics that stand out visually'],
  ['Versatilidad: funciona con procesos como inyección, extrusión y soplado', 'Versatility: it works with processes such as injection, extrusion, and blow molding'],
  ['Resistente a la luz UV y al calor, ideal para exteriores y aplicaciones exigentes', 'Resistant to UV light and heat, ideal for outdoor and demanding applications'],
  ['Permite ajustar tonos y efectos nacarados/metalizados mediante la cantidad usada', 'It allows pearlescent and metallic tones/effects to be adjusted through dosage'],
  ['Mezcla bien el pigmento para evitar rayas o zonas con brillo desigual.', 'Mix the pigment well to avoid streaks or uneven shine.'],
  ['Mantén temperaturas constantes al procesar para evitar decoloraciones.', 'Keep processing temperatures steady to avoid discoloration.'],
  ['Una dosificación demasiado alta puede afectar la procesabilidad o las propiedades mecánicas del plástico.', 'Excessive dosage can affect processability or the plastic’s mechanical properties.'],
  ['Verifica que la resina base sea compatible para conservar el acabado óptimo.', 'Verify that the base resin is compatible to preserve the optimal finish.'],
  ['Al aplicarlo, forma una capa blanca transparente con derivados orgánicos.', 'When applied, it forms a transparent white layer with organic derivatives.'],
  ['Esa capa limpia los contaminantes y el óxido sin dañar el metal.', 'That layer removes contaminants and oxide without damaging the metal.'],
  ['Se evapora dejando el molde libre de residuos visibles.', 'It evaporates, leaving the mold free of visible residue.'],
  ['Agita bien el envase para mezclar el contenido.', 'Shake the container well to mix the contents.'],
  ['Rocía una capa ligera y uniforme,', 'Spray a light, even coat,'],
  ['Si es necesario, reaplica en las zonas donde queden residuos.', 'If needed, reapply in areas where residue remains.'],
  ['Limpia el molde y sus cavidades como haces normalmente.', 'Clean the mold and its cavities as usual.'],
  ['para que se evapore el limpiador.', 'for the cleaner to evaporate.'],
  ['Retira el exceso con un paño seco.', 'Remove any excess with a dry cloth.'],
  ['No es abrasivo: sus ingredientes orgánicos no dañan los moldes metálicos.', 'It is non-abrasive: its organic ingredients do not damage metal molds.'],
  ['No es tóxico: formulado para uso seguro y manejo industrial.', 'It is non-toxic: formulated for safe use and industrial handling.'],
  ['Facilita la liberación de piezas moldeadas por', 'It facilitates the release of parts molded by'],
  ['Facilita la liberación de units moldeadas por', 'It facilitates the release of parts molded by'],
  ['Evita la necesidad de aplicar desmoldante externo en moldes en producción.', 'It eliminates the need to apply external mold release to production molds.'],
  ['Mantiene su efecto constante durante todo el proceso.', 'It maintains a consistent effect throughout the entire process.'],
  ['Disminuye el coeficiente de fricción entre la pieza y el molde.', 'It reduces the coefficient of friction between the part and the mold.'],
  ['Disminuye el coeficiente de fricción entre la unit y el molde.', 'It reduces the coefficient of friction between the part and the mold.'],
  ['Libera piezas automáticamente durante la producción, sin necesidad de aplicar aerosol desmoldante.', 'It releases parts automatically during production without needing aerosol mold release.'],
  ['Libera units automáticamente durante la producción, sin necesidad de aplicar aerosol desmoldante.', 'It releases parts automatically during production without needing aerosol mold release.'],
  ['Rendimiento eficiente: bajo costo y aplicación sencilla.', 'Efficient performance: low cost and simple application.'],
  ['Mismo efecto químico, misma pureza, misma función', 'Same chemical effect, same purity, same function'],
  ['Se diferencian en la presentación física: el AD-305 es polvo; el AD-309 microesfera (granulado)', 'They differ in physical presentation: AD-305 is powder, while AD-309 is microsphere (granulated)'],
  ['Pesa la cantidad adecuada de aditivo según la resina.', 'Weigh the correct amount of additive according to the resin.'],
  ['Mézclalo con los demás aditivos.', 'Mix it with the other additives.'],
  ['Agita 5 minutos.', 'Mix for 5 minutes.'],
  ['Agrega el concentrado de color.', 'Add the color concentrate.'],
  ['Mezcla otros 7 minutos.', 'Mix for another 7 minutes.'],
  ['Al calentar, el aditivo se funde dentro del plástico fundido.', 'When heated, the additive melts inside the molten plastic.'],
  ['Al enfriarse, empieza a migrar hacia la superficie.', 'As it cools, it starts to migrate toward the surface.'],
  ['Forma una capa interna que ayuda al desmoldeo.', 'It forms an internal layer that helps release the part.'],
  ['Con cadenas de carbono cortas la migración es más rápida.', 'With short carbon chains, migration is faster.'],
  ['Puede generar una capa ligera sobre la pieza que afecte decoraciones superficiales como serigrafía, hot stamping o etiquetado.', 'It may create a light film on the part that affects surface decoration such as screen printing, hot stamping, or labeling.'],
  ['Puede generar una capa ligera sobre la unit que afecte decoraciones superficiales como serigrafía, hot stamping o etiquetado.', 'It may create a light film on the part that affects surface decoration such as screen printing, hot stamping, or labeling.'],
  ['Si el acabado decorativo es crítico, recomendamos evaluar productos con cadena larga de carbono (como el AD-319 Slip L).', 'If decorative finish is critical, we recommend evaluating long-carbon-chain products such as AD-319 Slip L.'],
  ['AD-314 BASE MACRO BATCH', 'AD-314 MACRO BATCH BASE'],
  ['AD-309 DESMOLDANTE GRANULADO', 'AD-309 GRANULATED MOLD RELEASE'],
  ['AD-310 DESMOLDANTE CON SILICÓN', 'AD-310 SILICONE MOLD RELEASE'],
  ['AD-312 LIMPIADOR DE MOLDES', 'AD-312 MOLD CLEANER'],
  ['AD-304 PROTECTOR UV', 'AD-304 UV PROTECTOR'],
  ['AD-313 PERLA NATURAL', 'AD-313 NATURAL PEARL'],
  ['AD-321 SECANTE DE HUMEDAD', 'AD-321 MOISTURE SCAVENGER'],
  ['AD-307 SERIE NB', 'AD-307 NB SERIES'],
  ['AD-302 PASTA DE SILICON', 'AD-302 SILICONE PASTE'],
  ['AD-302 PASTA DE SILICÓN', 'AD-302 SILICONE PASTE'],
  ['AMARILLO HUEVO', 'EGG YELLOW'],
  ['AMARILLO CANARIO', 'CANARY YELLOW'],
  ['AMARILLO CLÁSICO', 'CLASSIC YELLOW'],
  ['AMARILLO CLASICO', 'CLASSIC YELLOW'],
  ['AMARILLO ELÉCTRICO', 'ELECTRIC YELLOW'],
  ['AMARILLO ELECTRICO', 'ELECTRIC YELLOW'],
  ['AZUL REY', 'ROYAL BLUE'],
  ['AZUL PASTEL CLARO', 'LIGHT PASTEL BLUE'],
  ['AZUL PASTEL', 'PASTEL BLUE'],
  ['ROSA PASTEL CLARO', 'LIGHT PASTEL PINK'],
  ['ROSA PASTEL', 'PASTEL PINK'],
  ['VERDE ELÉCTRICO', 'ELECTRIC GREEN'],
  ['VERDE ELECTRICO', 'ELECTRIC GREEN'],
  ['VERDE LIMÓN', 'LIME GREEN'],
  ['VERDE LIMON', 'LIME GREEN'],
  ['VERDE BANDERA', 'FLAG GREEN'],
  ['ROJO BANDERA', 'FLAG RED'],
  ['NARANJA BRILLANTE', 'BRIGHT ORANGE'],
  ['NARANJA FLUORESCENTE', 'FLUORESCENT ORANGE'],
  ['ROJO CRISTAL FLUORESCENTE', 'FLUORESCENT CRYSTAL RED'],
  ['VERDE CRISTAL FLUORESCENTE', 'FLUORESCENT CRYSTAL GREEN'],
  ['NARANJA CRISTAL FLUORESCENTE', 'FLUORESCENT CRYSTAL ORANGE'],
  ['NEGRO HUMO CRISTAL', 'CRYSTAL SMOKE BLACK'],
  ['ROSA MEXICANO', 'MEXICAN PINK'],
  ['VERDE PISTACHE', 'PISTACHIO GREEN'],
  ['GRIS CLARO', 'LIGHT GRAY'],
  ['GRIS MEDIO', 'MEDIUM GRAY'],
  ['GRIS FUERTE', 'DARK GRAY'],
  ['NEGRO ULTRAFINO', 'ULTRAFINE BLACK'],
  ['NEGRO KALO BRILLANTE', 'BRIGHT KALO BLACK'],
  ['NEGRO KALO ECONOMICO', 'ECONOMY KALO BLACK'],
  ['NEGRO KALO PREMIUM', 'PREMIUM KALO BLACK'],
  ['ROJO CHAPULIN', 'GRASSHOPPER RED'],
  ['ROJO COCA', 'COKE RED'],
  ['AZUL TAPA', 'CAP BLUE'],
  ['AZUL JUGUETE', 'TOY BLUE'],
  ['VERDE JUGUETE', 'TOY GREEN'],
  ['AZUL PELÍCULA INTENSO', 'INTENSE FILM BLUE'],
  ['AZUL PELICULA INTENSO', 'INTENSE FILM BLUE'],
  ['AMARILLO PELÍCULA INTENSO', 'INTENSE FILM YELLOW'],
  ['AMARILLO PELICULA INTENSO', 'INTENSE FILM YELLOW'],
  ['NARANJA PELÍCULA INTENSO', 'INTENSE FILM ORANGE'],
  ['NARANJA PELICULA INTENSO', 'INTENSE FILM ORANGE'],
  ['ROJO PELÍCULA', 'FILM RED'],
  ['ROJO PELICULA', 'FILM RED'],
  ['VERDE PELÍCULA', 'FILM GREEN'],
  ['VERDE PELICULA', 'FILM GREEN'],
  ['DESLIZANTE ALTA TRANSPARENCIA', 'HIGH-TRANSPARENCY SLIP'],
  ['DESLIZANTE', 'SLIP'],
  ['PERLA NATURAL', 'NATURAL PEARL'],
  ['SERIE NB', 'NB SERIES'],
  ['SECANTE DE HUMEDAD', 'MOISTURE SCAVENGER'],
  ['PASTA DE SILICON', 'SILICONE PASTE'],
  ['PASTA DE SILICÓN', 'SILICONE PASTE'],
  ['BASE MACRO BATCH', 'MACRO BATCH BASE'],
];

const TERM_REPLACEMENTS = [
  ['Opaco', 'Opaque'],
  ['Cristal', 'Crystal'],
  ['acabado-solido', 'Solid finish'],
  ['acabado-translucido', 'Translucent finish'],
  ['Amarillo', 'Yellow'],
  ['Azul', 'Blue'],
  ['Blanco', 'White'],
  ['Negro', 'Black'],
  ['Rojo', 'Red'],
  ['Verde', 'Green'],
  ['Rosa', 'Pink'],
  ['Morado', 'Purple'],
  ['Naranja', 'Orange'],
  ['Gris', 'Gray'],
  ['Café', 'Brown'],
  ['Cafe', 'Brown'],
  ['Guinda', 'Maroon'],
  ['Beige', 'Beige'],
  ['Magenta', 'Magenta'],
  ['Marfil', 'Ivory'],
  ['Ambar', 'Amber'],
  ['Ámbar', 'Amber'],
  ['Aluminio', 'Aluminum'],
  ['Uva', 'Grape'],
  ['vibrante', 'vibrant'],
  ['Claro', 'Light'],
  ['Oscuro', 'Dark'],
  ['Brillante', 'Bright'],
  ['Medio', 'Medium'],
  ['Pastel', 'Pastel'],
  ['Eléctrico', 'Electric'],
  ['Electrico', 'Electric'],
  ['Canario', 'Canary'],
  ['Fluorescente', 'Fluorescent'],
  ['Bandera', 'Flag'],
  ['Juguete', 'Toy'],
  ['Lazo', 'Ribbon'],
  ['Película', 'Film'],
  ['Pelicula', 'Film'],
  ['Intenso', 'Intense'],
  ['Especial', 'Special'],
  ['Militar', 'Military'],
  ['Marburgo', 'Marburg'],
  ['Bucarest', 'Bucharest'],
  ['Terracota', 'Terracotta'],
  ['Maceta', 'Flowerpot'],
  ['Barro', 'Clay'],
  ['Natural', 'Natural'],
  ['Lineal', 'Linear'],
  ['Clasico', 'Classic'],
  ['Clásico', 'Classic'],
  ['Polietileno Alta Densidad', 'High-density polyethylene'],
  ['Polietileno de alta densidad', 'High-density polyethylene'],
  ['Polietileno Baja Densidad', 'Low-density polyethylene'],
  ['Polietileno de baja densidad', 'Low-density polyethylene'],
  ['Polietileno Baja Densidad Lineal', 'Linear low-density polyethylene'],
  ['Polietileno baja densidad lineal', 'Linear low-density polyethylene'],
  ['Resins recycleds', 'Recycled resins'],
  ['Polipropileno', 'Polypropylene'],
  ['Polipropilenos', 'Polypropylenes'],
  ['Polietilenos', 'Polyethylenes'],
  ['Poliestireno Cristal', 'Crystal polystyrene'],
  ['Poliestireno cristal', 'Crystal polystyrene'],
  ['Poliestireno de Alto o Mediano Impacto', 'High- or medium-impact polystyrene'],
  ['Poliestireno alto o medio impacto', 'High- or medium-impact polystyrene'],
  ['Poliestireno', 'Polystyrene'],
  ['Compuesto de PVC rígido', 'Rigid PVC compound'],
  ['Compuesto de PVC flexible', 'Flexible PVC compound'],
  ['Compuestos de PVC no tráslucidos', 'Non-translucent PVC compounds'],
  ['Compuestos de PVC', 'PVC compounds'],
  ['Compuesto de PVC', 'PVC compound'],
  ['ABS Cristal', 'Crystal ABS'],
  ['Policarbonato', 'Polycarbonate'],
  ['Acrilico', 'Acrylic'],
  ['Poliamidas', 'Polyamides'],
  ['TPU sólido', 'Solid TPU'],
  ['Inyección (colada fría y caliente)', 'Injection (cold and hot runner)'],
  ['Inyección colada fría', 'Cold-runner injection'],
  ['Inyección colada caliente', 'Hot-runner injection'],
  ['Inyección', 'Injection'],
  ['Extrusión', 'Extrusion'],
  ['Soplado', 'Blow molding'],
  ['Rotomoldeo', 'Rotomolding'],
  ['Termoformado', 'Thermoforming'],
];

const EXTRA_PHRASE_REPLACEMENTS = [
  ['This masterbatch additive concentrate, está formulado con una combinación única mineral compounds and additives to improve antiblocking and slip properties in film manufacturing.', 'This masterbatch additive concentrate is formulated with a unique combination of mineral compounds and additives to improve antiblocking and slip properties in film manufacturing.'],
  ['This masterbatch additive concentrate, está formulado con una combinación única mineral compounds and additives para mejorar las propiedades de antibloqueo y deslizamiento en la fabricación de films.', 'This masterbatch additive concentrate is formulated with a unique combination of mineral compounds and additives to improve antiblocking and slip properties in film manufacturing.'],
  ['Se usa para liberar units de plástico producidas por', 'It is used to release plastic parts produced by'],
  ['Gracias a sus solventes y propelentes, seca casi de inmediato y permite liberar más units por disparo.', 'Thanks to its solvents and propellants, it dries almost immediately and allows more parts to be released per cycle.'],
  ['<strong >Transparencia</strong>: un uso excesivo puede dejar la superficie bright o grasosa. Si eso ocurre, limpia la unit con un paño seco de microfibra.', '<strong>Transparency</strong>: excessive use can leave the surface shiny or greasy. If that happens, clean the part with a dry microfiber cloth.'],
  ['<strong >Alimentación / salud</strong>: no recomendado para units que estarán en contacto directo con alimentos o medicamentos, a menos que se verifique que cumple normas regulatorias específicas.', '<strong>Food / health</strong>: not recommended for parts that will be in direct contact with food or medicines unless compliance with specific regulatory standards is verified.'],
  ['Pero se recomienda hacer pruebas específicas para tu application.', 'However, specific tests are recommended for your application.'],
  ['AD-320 es un aerosol desmoldante sin silicón, con extractos de origen vegetal.', 'AD-320 is a silicone-free aerosol mold-release agent made with plant-based extracts.'],
  ['Está formulado para liberar units plásticas producidas por', 'It is formulated to release plastic parts produced by'],
  ['¿Sirve en units para alimentos y medicamentos?', 'Can it be used for food and medical parts?'],
  ['¡Sí! AD-320 puede usarse en units que estarán en contacto con alimentos o productos farmacéuticos, siempre que se cumplan las normas regulatorias correspondientes.', 'Yes. AD-320 can be used on parts that will be in contact with food or pharmaceutical products, provided the relevant regulatory standards are met.'],
  ['Además, este desmoldante se usa ampliamente en <strong >odontología</strong>, donde facilita la liberación de units como prótesis en moldes de yeso.', 'In addition, this mold-release agent is widely used in <strong>dentistry</strong>, where it helps release parts such as prostheses from plaster molds.'],
  ['MB-105 is ideal for molding processes for <strong >extrusion para la fabricación de plastic film.</strong>', 'MB-105 is ideal for molding processes for <strong>extrusion in plastic film manufacturing.</strong>'],
  ['MB-200 is ideal for molding processes for <strong>extrusion para la fabricación de plastic film.</strong>', 'MB-200 is ideal for molding processes for <strong>extrusion in plastic film manufacturing.</strong>'],
  ['MB-110 is ideal for molding processes for <strong >extrusion para fabricación de film principalmente.</strong>', 'MB-110 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>'],
  ['MB-125 is ideal for molding processes for <strong >extrusion para fabricación de film principalmente.</strong>', 'MB-125 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>'],
  ['MB-126 is ideal for molding processes for <strong >extrusion para fabricación de film principalmente.</strong>', 'MB-126 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>'],
  ['MB-127 is ideal for molding processes for <strong >extrusion para fabricación de film principalmente.</strong>', 'MB-127 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>'],
  ['MB-221 is ideal for molding processes for <strong >extrusion para fabricación de film principalmente.</strong>', 'MB-221 is ideal for molding processes for <strong>extrusion, mainly for film manufacturing.</strong>'],
  ['MB-225 is ideal for molding processes for <strong >injection and extrusion principalmente.</strong>', 'MB-225 is ideal for molding processes for <strong>injection and extrusion, mainly.</strong>'],
  ['MB-231 is ideal for molding processes for <strong >injection and extrusion principalmente.</strong>', 'MB-231 is ideal for molding processes for <strong>injection and extrusion, mainly.</strong>'],
  ['Su formulación permite una integración fluida con resinas <strong >recycleds</strong>, ensuring high-quality results.', 'Its formulation integrates smoothly with <strong>recycled resins</strong>, ensuring high-quality results.'],
  ['Su formulación permite una integración fluida con<strong > resinas recycleds</strong>, ensuring high-quality results.', 'Its formulation integrates smoothly with <strong>recycled resins</strong>, ensuring high-quality results.'],
  ['This masterbatch color concentrate, is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, that provides a blue, ideal para aplicaciones donde se utilizan resinas plásticas recycleds, con cargas de carbonatos, color white o blue.', 'This masterbatch color concentrate is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, ideal for applications that use recycled plastic resins with carbonate fillers and white or blue base color.'],
  ['This masterbatch color concentrate, is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, that provides a red, ideal para aplicaciones donde se utilizan resinas plásticas recycleds, con cargas de carbonatos, color white o blue.', 'This masterbatch color concentrate is formulated with a unique combination of organic and inorganic pigments plus mineral fillers, ideal for applications that use recycled plastic resins with carbonate fillers and white or blue base color.'],
  ['<strong >Alta migración: </strong>no utilizar en resinas virgenes.', '<strong>High migration: </strong>do not use in virgin resins.'],
  ['<strong >No utilizar en resinas virgines, debido a la migración que presenta.</strong>', '<strong>Do not use in virgin resins due to its migration behavior.</strong>'],
  ['AD-311 protege las cavidades y superficies de los moldes cuando no están en uso. Previene manchas, oxidación e incrustaciones de óxido.', 'AD-311 protects mold cavities and surfaces when they are not in use. It helps prevent stains, oxidation, and oxide buildup.'],
  ['Forma una capa blanca en el metar, hecha con derivados inorgánicos a base de titanio.', 'It forms a white layer on the metal, made from titanium-based inorganic derivatives.'],
  ['Esa capa repele humedad, aceites y grasa.', 'That layer repels moisture, oils, and grease.'],
  ['Brinda protección prolongada contra corrosión natural.', 'It provides prolonged protection against natural corrosion.'],
  ['Limpia bien la superficie del molde y las cavidades como lo haces normalmente.', 'Clean the mold surface and cavities thoroughly as usual.'],
  ['Aplica un poco de limpiador de moldes AD-311 y remove any excess with a dry cloth.', 'Apply a small amount of AD-311 mold cleaner and remove any excess with a dry cloth.'],
  ['Espera unos <strong>3 minutos</strong> for the cleaner to evaporate.', 'Wait about <strong>3 minutes</strong> for the cleaner to evaporate.'],
  ['Agita bien el envase del Protector de Moldes para mezclar el contenido.', 'Shake the Mold Protector container well to mix the contents.'],
  ['Aplica una capa blanca uniforme from about <strong>10 cm</strong> de distancia.', 'Apply an even white coat from about <strong>10 cm</strong> away.'],
  ['Deja secar. Reaplica donde consideres necesario.', 'Let it dry. Reapply wherever needed.'],
  ['Cuando sea necesario, limpia nuevamente el molde con AD-311.', 'When needed, clean the mold again with AD-311.'],
  ['<strong>¿Es abrasivo?</strong> No. Los materiales son orgánicos con aditivos metálicos, pero no dañan los moldes.', '<strong>Is it abrasive?</strong> No. The materials are organic with metallic additives, but they do not damage the molds.'],
  ['<strong>¿Tóxico?</strong> Tampoco. El ingrediente principal es un derivado de zinc, anticorrosivo, en formas químicas que no representan riesgos para la salud.', '<strong>Toxic?</strong> No. The main ingredient is an anticorrosive zinc derivative in chemical forms that do not pose health risks.'],
  ['Lubiwax es una mezcla de ceras polietilénicas usada como lubricante interno en plásticos.', 'Lubiwax is a blend of polyethylene waxes used as an internal lubricant in plastics.'],
  ['Lubiwax es una mezcla de ceras polietilénicas usada como lubricante interno y externo en plásticos.', 'Lubiwax is a blend of polyethylene waxes used as an internal and external lubricant in plastics.'],
  ['Disminuye la fricción entre la resina y la maquinaria.', 'It reduces friction between the resin and the machinery.'],
  ['Mejora el flujo del plástico, sobre todo cuando tiene pigmentos o cargas minerales.', 'It improves plastic flow, especially when pigments or mineral fillers are present.'],
  ['Facilita el desmoldeo de units moldeadas.', 'It facilitates the release of molded parts.'],
  ['Mejora el acabado superficial final.', 'It improves the final surface finish.'],
  ['No usar en PVC rígido o flexible. Puede provocar desprendimiento de cloro, lo que afecta la estabilidad del material.', 'Do not use in rigid or flexible PVC. It may cause chlorine release, which affects material stability.'],
  ['Puede usarse starting from<strong > 5 grams por kilo</strong>. Se puede incrementar o disminuir la application, dependiendo del resultado obtenido.', 'It can be used starting from <strong>5 grams per kilogram</strong>. The dosage can be increased or decreased depending on the result obtained.'],
  ['Aditivo formulado con una mezcla de ceras y estearatos de alta pureza, diseñado para actuar como lubricante interno y externo en processs de transformación de polímeros.', 'Additive formulated with a blend of high-purity waxes and stearates, designed to act as an internal and external lubricant in polymer processing.'],
  ['Optimiza el acabado superficial final de las units plásticas.', 'It optimizes the final surface finish of plastic parts.'],
  ['<strong >No usar en PVC compounds rígido o flexible</strong>, ya que puede causar desprendimiento de átomos de cloro del polímero, lo que afecta su estabilidad y propiedades.', '<strong>Do not use in rigid or flexible PVC compounds</strong>, as it may cause chlorine atoms to separate from the polymer, affecting its stability and properties.'],
  ['Dosis inicial: entre <strong >0.2 % y 8.0 %</strong> (2 a 8 grams por kg de resina), según application y exigencia.', 'Initial dosage: between <strong>0.2% and 8.0%</strong> (2 to 8 grams per kg of resin), depending on the application and performance requirements.'],
  ['Ajustes pueden requerirse con cargas minerales, pigmentos u otros aditivos presentes.', 'Adjustments may be required when mineral fillers, pigments, or other additives are present.'],
  ['Facilita el desmoldeo, reduce desgaste del molde', 'It facilitates release and reduces mold wear'],
  ['AD-320 DESMOLDANTE SIN SILICÓN', 'AD-320 SILICONE-FREE MOLD RELEASE'],
  ['AD-302 es una silicone paste que sirve como lubricante de maquinaria y equipo.', 'AD-302 is a silicone paste used as a lubricant for machinery and equipment.'],
  ['AD-305 SLIP DESMOLDANTE EN POLVO', 'AD-305 POWDER SLIP MOLD RELEASE'],
  ['AD-317 ESTEARATO DE ZINC', 'AD-317 ZINC STEARATE'],
  ['AD-317 es un polvo blanco derivado del zinc que actúa como lubricante interno, dispersante térmico y estabilizador para plásticos.', 'AD-317 is a white zinc-derived powder that acts as an internal lubricant, thermal dispersant, and stabilizer for plastics.'],
  ['Está formulado con ácidos grasos de alta pureza.', 'It is formulated with high-purity fatty acids.'],
  ['Actúa como neutralizador de residuos ácidos o básicos que se generan durante la polimerización.', 'It acts as a neutralizer for acidic or basic residues generated during polymerization.'],
  ['Ayuda a proteger los moldes al evitar que el material se adhiera o genere arrastre.', 'It helps protect molds by preventing the material from sticking or dragging.'],
  ['Facilita el deslizamiento entre polímero y máquina, reduciendo la fricción.', 'It facilitates sliding between the polymer and the machine, reducing friction.'],
  ['Mejora la fluidez del plástico durante procesos como inyección, extrusión, soplado y rotomoldeo.', 'It improves plastic flow during processes such as injection, extrusion, blow molding, and rotomolding.'],
  ['Mejora la fluidez del plástico durante processs como injection, extrusion, blow molding and rotomolding.', 'It improves plastic flow during processes such as injection, extrusion, blow molding, and rotomolding.'],
  ['It is used to release plastic parts produced by <strong >injection</strong>, <strong >blow molding</strong> o <strong >thermoforming</strong>.', 'It is used to release plastic parts produced by <strong>injection</strong>, <strong>blow molding</strong>, or <strong>thermoforming</strong>.'],
  ['It is used to release plastic parts produced by <strong >injection</strong>, <strong >blow molding</strong> o <strong >thermoforming</strong>, con compatibilidad para decorados finales.', 'It is used to release plastic parts produced by <strong>injection</strong>, <strong>blow molding</strong>, or <strong>thermoforming</strong>, with compatibility for final decorative finishes.'],
  ['El carbonato de calcio en polvo it is used in plastics y es compatible con la mayoría de los polímeros. Mejora la rigidez y la dureza de las units.', 'Powdered calcium carbonate is used in plastics and is compatible with most polymers. It improves the stiffness and hardness of finished parts.'],
  ['El carbonato de calcio en polvo it is used in plastics y es compatible con la mayoría de los polímeros. Mejora la rigidez y la dureza de las piezas.', 'Powdered calcium carbonate is used in plastics and is compatible with most polymers. It improves the stiffness and hardness of finished parts.'],
  ['Dosage: between <strong>20 to 15 grams</strong> in extrusion; <strong>10 to 100 grams</strong> in injection and blow molding (dependiendo application).', 'Dosage: between <strong>15 to 20 grams</strong> in extrusion and <strong>10 to 100 grams</strong> in injection and blow molding, depending on the application.'],
  ['Mejora estabilidad dimensional; reduce costos', 'Improves dimensional stability; reduces costs'],
  ['Mejora flujo del material; reduce contracción', 'Improves material flow; reduces shrinkage'],
  ['Aumenta resistencia a grietas; mejora rigidez', 'Increases crack resistance; improves stiffness'],
  ['Ejemplos de aplicaciones:', 'Examples of applications:'],
  ['Ejemplos de applications:', 'Examples of applications:'],
  ['Abatelenguas', 'Tongue depressors'],
  ['Medidas dosificadoras para alimentos en polvo', 'Dosing scoops for powdered foods'],
  ['Capuchones para goteros', 'Dropper caps'],
  ['Tapas de envases de suplementos alimenticios', 'Caps for food supplement containers'],
  ['Cubiertos desechables', 'Disposable cutlery'],
  ['Otros artículos plásticos de uso alimenticio o médico', 'Other plastic items for food or medical use'],
  ['Este aditivo se usa como agente espumante en plásticos. Al procesarlo, libera gases que forman una estructura celular en el material. Así se reduce la densidad, obteniendo units un poco más ligeras.', 'This additive is used as a blowing agent in plastics. During processing, it releases gases that create a cellular structure in the material, reducing density and producing slightly lighter parts.'],
  ['Compatible con <strong >moldeo por injection</strong>, <strong >extrusion</strong> and <strong >rotomolding</strong>.', 'Compatible with <strong>injection molding</strong>, <strong>extrusion</strong>, and <strong>rotomolding</strong>.'],
  ['1 g por kilo de resina', '1 g per kilogram of resin'],
  ['Ajustes adicionales', 'Additional adjustments'],
  ['Aumentar solo si es necesario', 'Increase only if necessary'],
  ['Uso general', 'General use'],
  ['Dosage: between <strong >20 to 15 grams</strong> in extrusion; <strong >10 to 100 grams</strong> in injection and blow molding (dependiendo application).', 'Dosage: between <strong>15 to 20 grams</strong> in extrusion and <strong>10 to 100 grams</strong> in injection and blow molding, depending on the application.'],
  ['Para productos transparentes, cuida la dosis para evitar nubosidad o pérdida de claridad.', 'For transparent products, control the dosage to avoid haziness or loss of clarity.'],
  ['Evitar concentraciones muy altas; pueden afectar el acabado superficial o la estabilidad térmica del material.', 'Avoid very high concentrations; they may affect surface finish or the material’s thermal stability.'],
  ['Almacenar en lugar seco y fresco para evitar que absorba humedad, lo cual puede afectar su rendimiento.', 'Store in a cool, dry place to prevent moisture absorption, which may affect performance.'],
  ['Ventajas frente al estearato de calcio', 'Advantages over calcium stearate'],
  ['Ofrece mejor dispersión y lubricación, lo que mejora la eficiencia del procesamiento.', 'It offers better dispersion and lubrication, improving processing efficiency.'],
  ['Soporta mejor las temperaturas elevadas, útil en applications exigentes.', 'It handles elevated temperatures better, making it useful in demanding applications.'],
  ['Menor impacto sobre la transparencia: ideal para plásticos donde se busca claridad.', 'Lower impact on transparency: ideal for plastics where clarity is important.'],
  ['El Expanso Raywan se descompone entre los <strong >190 °C y 210 °C</strong> para producir los gases necesarios.', 'Expanso Raywan decomposes between <strong>190 °C and 210 °C</strong> to produce the necessary gases.'],
];

export function translateProductTextToEn(value) {
  if (!value) return '';
  const withPhrases = applyReplacements(String(value), PHRASE_REPLACEMENTS);
  const withExtraPhrases = applyReplacements(withPhrases, EXTRA_PHRASE_REPLACEMENTS);
  const withTerms = applyReplacements(withExtraPhrases, TERM_REPLACEMENTS);
  return cleanupEnglish(withTerms);
}

export function translateProductHtmlToEn(value) {
  return translateProductTextToEn(value);
}

export function translateProductRecordToEn(product) {
  if (!product) return product;

  return {
    ...product,
    nombre: translateProductTextToEn(product.nombre || ''),
    descripcion: translateProductTextToEn(product.descripcion || ''),
    tipo: translateProductTextToEn(product.tipo || ''),
    acabado: translateProductTextToEn(product.acabado || ''),
    color: translateProductTextToEn(product.color || ''),
    informacion: translateProductHtmlToEn(product.informacion || ''),
  };
}
