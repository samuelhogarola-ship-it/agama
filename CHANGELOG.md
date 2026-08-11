# CHANGELOG

Registro oficial de cambios del proyecto AGAMA. A partir de esta fase, este archivo sustituye a `MEJORAS.md` como bitácora canónica.

## 2026-08-11

- fix(nav): el megamenú de productos conserva ancho completo al abrirse desde `/eventos/` y queda protegido con smoke test visual.
- chore(repo): se registra `codex/fix-eventos-product-dropdown` como rama activa del worktree para permitir el commit bajo los guardrails existentes.

## 2026-08-10

- fix(online): la card de Pigmentos inicia con una foto de producto a escala consistente y muestra código y nombre sincronizados para BP-645, BP-231 y BP-101 en ES/EN.
- fix(online): la tercera sección mantiene el título de Pigmentos y el H3 de Masterbatch dentro de sus cards, y reserva espacio estable para que los dos botones de producto permanezcan visibles en escritorio y móvil.
- feat(online): se restaura la experiencia comercial de AGAMA Online con hero de producto, configurador, assets visuales y scripts asociados, conservando la nav actual de Puntos de venta, Tienda online, Eventos, Blog AGAMA y Contacto.
- chore(repo): se registra `codex/restore-online-product-hero` como ola activa del worktree para permitir el commit bajo los guardrails existentes.

## 2026-08-03

- fix(online): se elimina la sección "Cómo pedir en 4 pasos" y la barra CTA fija en móvil de `filiales/online/` ES/EN; el botón de hero en móvil pasa a layout flex compacto en lugar de `width: 100%`.
- fix(online): el FAQ de pedido online conserva el enlace protegido de cotización por WhatsApp y el smoke móvil valida el hero compacto sin barra CTA fija.

## 2026-07-30

- fix(filiales): Zaragoza unifica su horario visible y Schema.org a lunes-sábado `07:00–19:00`; Merced unifica lunes-sábado a `09:00–18:00` y conserva domingo `09:00–15:00`.

## 2026-07-29

- chore(filiales): el bloqueo de datos sensibles mantiene autorización explícita y evidencia con huella SHA-256, pero publica automáticamente el status requerido por `main` para evitar esperas manuales duplicadas.
- fix(filiales): Ermita corrige únicamente la sucursal bancaria visible y baseline a `7017` por indicación del usuario; se conserva cuenta `3469-983` y cuenta interbancaria `002-849-701-734-699-834`.
- fix(filiales): Toluca actualiza solo el WhatsApp visible y CTAs a `+52 722 499 7514`; se mantiene separado del teléfono fijo `+52 722 946 8099`.
- fix(filiales): Toluca actualiza el correo visible ES/EN a `toluca@agama.com.mx` y el smoke test protege el enlace `mailto` exacto.
- fix(filiales): Toluca unifica la dirección visible con el JSON-LD y FAQ usando `Av. Lerma 320-MZ 019, Santa Maria, San Isidro, 52105 San Mateo Atenco, Méx., México`; el smoke test protege la dirección completa.
- fix(filiales): una captura aportada por el usuario confirma para Toluca la razón social `PALMA AGAMA ANGEL`, RFC `PAAA-810709-JF0`, banco `Banamex`, sucursal `7004`, cuenta `2749-484` y cuenta interbancaria `002-180-700-427-494-844`; los datos vuelven a mostrarse en ES/EN y quedan protegidos por el baseline y el smoke test.

## 2026-07-27

- feat(online): AGAMA Online ES/EN pasa a una versión más comercial con cotizador rápido a WhatsApp, seis soluciones destacadas, barra fija móvil y jerarquía de compra orientada a captación sin tocar datos fiscales, bancarios ni de contacto.
- test(online): se protege el nuevo flujo comercial de `filiales/online/` con un smoke test que valida el H1, la precarga desde productos destacados, el ancla de cotización y la CTA fija en móvil.
- chore(repo): se actualizan `docs/worktree-control.json` y `docs/change-scope.md` para registrar la rama activa y declarar explícitamente el alcance permitido de esta intervención.

## 2026-07-26

- fix(seo): se añaden redirecciones 301 y respuestas 410 para las 114 URLs 404 exportadas desde Google Search Console, conservando filiales, vacantes, productos, eventos y landings actuales como destinos canónicos.

## 2026-07-25

- fix(blog): se refuerza la visibilidad del CTA final del post de pigmentos con `-webkit-text-fill-color`, color blanco explícito y override inline para evitar que estilos globales de texto lo vuelvan azul sobre fondo azul.
- feat(seo): la landing `/masterbatch/` se reorienta de guía SEO a página comercial técnica, con copy más directo, breadcrumbs visibles, CTA de cotización, bloques de valor por aplicación/proceso y FAQ más útil para mejorar valor de usuario y E-E-A-T.
- feat(seo): la landing `/pigmentos/` alcanza el mismo estándar comercial técnico, incorpora más contenido útil por tipo/proceso/cotización y añade galería visible, `ImageGallery` y entradas de imagen en sitemap para reforzar indexación.
- feat(seo): la landing `/aditivos/` se reestructura con enfoque comercial técnico, diagnóstico por problema/proceso, CTA de cotización y fotos indexables mediante galería visible, `ImageGallery` y sitemap de imágenes.
- feat(eventos): `/eventos/meximold-queretaro/` usa el nuevo hero WebP de AGAMA Meximold 2026 stand 558, refuerza contenido con datos oficiales de Meximold, añade señales para moldeo por inyección/manufactura de moldes y declara la imagen en schema/sitemap para indexación.
- feat(eventos): `/eventos/plastimagen-cdmx/` usa el flyer WebP de AGAMA Plastimagen 2026 stand 558, corrige contraste/copy visible, elimina lenguaje genérico interno, refuerza contenido B2B con datos oficiales de Plastimagen e incorpora hero y fotos de producto en schema/sitemap para indexación.
- feat(blog): el post `/entrada-de-blog/agama-en-meximold-2026/` incorpora una portada WebP con logo AGAMA y referencia visible a Meximold 2026 stand 558, reescribe el contenido con contexto real de moldes/inyección/herramentales y corrige el contraste del CTA final.

## 2026-07-23

- fix(eventos): el bloque de agenda abandona el panel oscuro y adopta una paleta gris perla industrial con tarjetas blancas y acentos azul AGAMA para mantener un tono premium sobrio.
- test(portal): los smoke tests del portal arrancan Next con Webpack para evitar el fallo local de Turbopack cuando no está disponible el binding nativo de SWC.
- fix(blog): se restauran las fotos históricas visibles de los posts antiguos que ya tenían imagen propia, manteniendo los WebP nuevos con logo AGAMA como imágenes adicionales indexables en sitemap y datos estructurados.
- feat(blog): se sustituyen las imágenes destacadas de los posts públicos por WebP generados con el logo oficial de AGAMA, metadatos XMP, alt text ES/EN, Open Graph/Twitter/ImageObject y entradas de imagen en sitemap para mejorar indexación.
- test(filiales): se da margen propio de 60s a los dos smoke tests que recorren todas las filiales ES/EN para evitar timeouts falsos sin relajar las aserciones de Maps, cuenta y cuenta interbancaria visibles.

## 2026-07-22

- fix(imagen): se normaliza a un único parámetro `20260722masterbatch2` la versión cache-busting de `home-custom.css` en páginas ES/EN que muestran Masterbatch y el validador rechaza URLs duplicadas.
- fix(imagen): la referencia visual compartida de Masterbatch elimina el recipiente gris, adopta nombres versionados para evitar caché, corrige la banda gris de composición de Safari en sus tarjetas y actualiza todas sus apariciones públicas y el generador del catálogo.
- fix(filiales): los resúmenes visibles ES de las 15 filiales físicas anteriores a Toluca recuperan Sucursal, Cuenta y Cuenta Interbancaria, y se elimina la sección bancaria inferior duplicada; la prueba automática exige los datos dentro del resumen y una única aparición por página.
- fix(filiales): se obliga a revalidar el HTML tras cada despliegue y se añade una prueba ES/EN para las 17 filiales que protege la visibilidad de cuenta y cuenta interbancaria sin exponer sus valores en los logs.

## 2026-07-18

- fix(filiales): se restaura Toluca desde el historial previo a la remodelación visual para recuperar sus datos fiscales y bancarios completos en ES/EN y en el baseline padre.
- fix(filiales): se restauran en las fichas EN de filiales los campos bancarios faltantes desde el baseline padre y se publica junto con ajustes SEO/sitemap ya preparados.
- feat(seo): se refuerza `/masterbatch/` con contenido semántico adicional, FAQ visible/schema y señales internas para empujar `masterbatch México` sin tocar el catálogo.
- fix(filiales): Toluca actualiza su enlace de Google Maps a la ficha real de Agama Toluca confirmada por el usuario en hub, ficha ES/EN, JSON-LD y pruebas.
- fix(contacto): se mejora la legibilidad del H1 del hero en móvil ajustando ancho, tamaño, interlineado, contraste y margen seguro inferior en ES/EN.
- docs(seo): se añade la matriz de validación final de la ejecución SEO por PRs, con build, smoke, sitemap, canonicales y alcance confirmado.
- feat(seo): se refuerza el enlazado interno entre `/productos/`, categorías, landings SEO y `/filiales/online/` con CTAs diferenciados, sin modificar datos ni fichas.
- feat(seo): se añaden las landings ES-MX `/pigmentos/` y `/aditivos/` con contenido propio, CTAs a catálogo y conexión contextual desde home/blog.
- feat(seo): se crea la landing ES-MX `/masterbatch/` como activo SEO para `masterbatch México`, con CTA al catálogo existente y enlaces contextuales desde home/blog.
- fix(seo): se estabilizan canonicales EN ya presentes en sitemap y se alinea `/blog-agama/` como legacy hacia `/blog/` tras comprobar paridad de enlaces.
- fix(performance): la home recupera video de hero en móvil con una variante celular ligera de 374 KB y mantiene el MP4 pesado fuera de Android/iPhone.
- fix(performance): la home deja de descargar el video pesado del hero en móvil, usa poster ligero y conserva video optimizado en desktop para mejorar la carga en celular.
- feat(portal): se añade Google Analytics 4 con el ID `G-QV3KKP101K` al layout global de Next y se protege con smoke test.
- fix(filiales): Toluca cambia su enlace de Google Maps a una URL por coordenadas para abrir la ubicación de forma estable desde el hub y las fichas ES/EN.
- fix(contacto): se reactiva una intro visual ligera en móvil, adaptada a formato vertical, y el hero queda responsive con H1 visible en el primer viewport.
- fix(filiales): Toluca actualiza su enlace de Google Maps al destino confirmado, el hub hace más visible la acción "Ver mapa/View map" y el smoke test comprueba que el CTA sea visible.
- fix(filiales): el hub ES/EN añade una acción directa "Ver mapa/View map" por sucursal física para abrir Google Maps desde el listado, sin entrar primero a la ficha; AGAMA Online se mantiene sin enlace de mapa.
- fix(contacto): se corrige la cabecera de contacto en móvil para que el H1 no quede estrangulado, se desactiva la intro visual pesada en móviles/redes lentas y se sustituye su imagen base de 2.2 MB por el hero ligero existente.
- fix(filiales): las 15 filiales físicas confirmadas sustituyen los enlaces genéricos de Google Maps por URLs canónicas de ficha real; `hasMap` en JSON-LD queda alineado y el baseline/validación automatizada protege esa configuración ante regresiones futuras. `Toluca` permanece pendiente de verificación en esta capa de Maps.
- fix(filiales): Cuautitlán adopta en ES/EN, hub, tarjeta, Maps y JSON-LD la dirección confirmada `Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México`.
- fix(filiales): Toluca separa el WhatsApp `+52 1 55 2310 3494` del teléfono fijo `+52 722 946 8099` en las fichas ES/EN.
- docs(filiales): el baseline padre incorpora las confirmaciones recientes y protege WhatsApp como campo independiente del teléfono; el validador deja de depender de fechas fijas en los encabezados.

## 2026-07-17

- feat(filiales): las 15 sucursales físicas anteriores a Toluca incorporan, en ES y EN, el mismo patrón inicial de información de sucursal con horarios, contacto, dirección y resumen fiscal/bancario.
- fix(filiales): los nuevos resúmenes reutilizan literalmente los datos ya publicados en cada ficha; Merced conserva el teléfono fijo como pendiente y AGAMA Online queda fuera del patrón de sucursal física para mantener su evolución independiente hacia una tienda comercial real.
- docs(filiales): se documenta que esta unificación visual no modifica el baseline operativo, la metadata SEO, el JSON-LD ni las secciones completas de contacto y datos bancarios existentes.
- chore(repo): se sincroniza el control de worktrees con la rama activa de esta intervención y se registran las ramas paralelas como aparcadas, sin moverlas ni fusionarlas.
- test(filiales): el smoke test recorre las 30 fichas físicas ES/EN y protege la presencia del resumen, sus cuatro tarjetas y el enlace de Google Maps.

## 2026-07-10

- fix(nav): se añade `Eventos/Events` al header principal y a las plantillas compartidas del catálogo y blog estático.
- feat(eventos): se añade el cluster Meximold/Plastimagen con landings ES/EN, agenda en `/eventos/` y CTAs más comerciales alineados entre páginas de evento y artículos.
- feat(blog): se incorporan piezas editoriales relacionadas para Meximold y Plastimagen, con metadatos SEO, hreflang y enlaces internos coherentes.
- fix(copy): se eliminan afirmaciones genéricas o no verificadas en tarjetas, artículos y páginas de evento, y se corrigen naming/CTAs señalados en revisión.
- fix(blog): se elimina duplicación visual en `/blog/` y se corrige el placeholder compartido para que no rompa imágenes en rutas anidadas.

## 2026-07-05

- fix(eventos): Stand #752 → #750 para Meximold en tarjeta de exposiciones.
- fix(eventos): héroe simplificado — eliminado "Ver plan B2B" (post no publicado); WhatsApp CTA renombrado a "Coordinar visita" con mensaje prefilled.
- fix(eventos): eliminadas tres tarjetas de recursos que enlazaban a posts no publicados (404 en producción).
- feat(blog): nuevo post "AGAMA en Meximold: visítanos en la plaza 750" en `/entrada-de-blog/agama-en-meximold-2026/` (ES + EN). Categoría Eventos. Plaza 750 referenciada en título, meta, h1, cuerpo y CTA. Incluye Schema.org BlogPosting, CTA WhatsApp pre-rellenado y enlace a filiales/online. Añadido a `/blog/`, `/blog-agama/` y `sitemap.xml`. Imagen placeholder pendiente.
- feat(blog): nuevo post "AGAMA en Plastimagen: encuéntranos en la expo del plástico" en `/entrada-de-blog/agama-en-plastimagen-2026/`. Categoría Eventos. Incluye Schema.org BlogPosting, CTA WhatsApp y sección "¿No puedes venir?" enlazando filiales y AGAMA Online. Post añadido al índice de `/blog/` y `/blog-agama/`. Imagen placeholder pendiente de sustituir por foto real del stand.
## 2026-07-04

- fix(online): restaurado el botón "Valorar en Google" en el hero de AGAMA Online (ES + EN) — la filial sí tiene ficha en Google Business Profile.
- Transformada la página AGAMA Online de informativa a funcional: hero con CTAs "Ver productos" + "Cotizar por WhatsApp", CTAs de catálogo en cada tarjeta de oferta, nueva sección "Cómo pedir" con flujo de 4 pasos, FAQ 5 actualizada a pedido online, enlace roto del mosaico "Colores personalizados" corregido. Parity ES/EN.
- Añadido Schema.org `LocalBusiness` JSON-LD a las 16 filiales que carecían de él (chalco, cuautitlan, ecatepec, ermita, guadalajara, leon, merced, monterrey, online, pantitlan, puebla, queretaro, san-luis-potosi, texcoco, tlahuac, zaragoza), incluyendo parity ES/EN. La filial `online` usa `OnlineStore`. Datos extraídos del baseline auditado en `docs/filiales-data-lock-plan.md`.

## 2026-06-30

- Actualizado el precio de `AD-314 BASE MACRO BATCH` de `$24 MXN` a `$25 MXN` en Supabase, ficha ES/EN, schema Product y listado de aditivos.
- Optimizado el hero principal de la home manteniendo vídeo: se añaden variantes `WebM` y `MP4` más ligeras y se pasa a `preload="metadata"` con poster priorizado.
- Eliminado `ajax.googleapis.com/ajax/libs/webfont/webfont.js` de la home y de la cabecera compartida generada por `build.js`, sustituyéndolo por carga no bloqueante de fuentes con `display=swap`.
- Ajustadas prioridades de carga en recursos above the fold para mejorar LCP sin sustituir el hero por imagen estática.
- Optimizadas las imágenes `pigmento.jpg`, `master.jpg` y `aditivos.jpg`, y se refuerza su entrega con `WebP`, `srcset`, `sizes` y dimensiones explícitas en la home.

## 2026-06-24

- Se fija la Fase 1 de gobernanza del repo: rebaseline documental de filiales, changelog oficial, control de worktrees y control de alcance.
- Se incorpora `docs/change-scope.md` como fuente canónica del alcance permitido del cambio actual.
- Se incorporan validadores duros de worktree, scope, changelog, baseline de filiales y paridad ES/EN.
- Se documenta explícitamente que `validate-change-scope --audit` compara `baseline...HEAD` y no inspecciona cambios sin commit.
- Añadidas y ajustadas metadescripciones SEO únicas en `filiales/*/index.html` para las fichas de filiales de AGAMA, sin cambios en contenido visible.
- Optimizados los `<title>` y las metadescripciones de las filiales para reforzar SEO local en torno a `masterbatch` y `pigmentos`, sin modificar contenido visible.
- Refinada la redacción SEO de filiales para reducir repeticiones, variar el enfoque por sucursal y tratar `Online` como canal nacional sin referencia comercial a Zaragoza.
- fix(filiales): prevent AGAMA Online CTA clipping in local SEO cards
- Añadida validación rápida para microcambios visuales en páginas de filiales sin relajar datos sensibles.

## 2026-06-29

- Se protege `scripts/generate-static-blog.mjs` para preservar los dos posts manuales recientes aunque no existan en el snapshot histórico.
- Se añade al sitemap el primer post publicado y se mantiene fuera el segundo post programado/manual.
- Se actualiza el estado documental del blog y el alcance activo del microfix defensivo.
- Se activa la rama `fix/blog-agama-preview-primer-post` para un microfix limitado al índice legacy del blog.
- Se añade a `blog-agama/index.html` la preview de `el-precio-es-una-respuesta-no-una-explicacion`, ya publicado previamente en `/blog/`.
- Se mantiene sin cambios el segundo post preparado para publicación futura y sin exposición adicional en índices.

## 2026-06-17

- Los CTAs de WhatsApp en páginas de `filiales` pasan a tomar el número visible en el bloque de contacto de cada ficha en lugar de depender de un `wa.me` fijo compartido.
- El botón flotante de WhatsApp queda alineado con el número de la filial activa.
- Zaragoza no se modifica a nivel de contenido y conserva el dato que ya tenga publicado en su propia ficha.

## 2026-06-15

- Se restaura un bloque visible de `Datos fiscales y bancarios` en todas las páginas de `filiales`.
- Se recupera como fuente histórica el contenido de `https://www.agama.com.mx/tiendas`.
- Cada sucursal vuelve a mostrar titular fiscal, RFC, banco, cuenta y cuenta interbancaria según el producto antiguo.
- `Toluca` se deja sin ficha histórica propia en `/tiendas` y reutiliza entonces los datos corporativos de `Agama Online` para no quedar sin referencia fiscal/bancaria.

## 2026-06-06

- Se unifica la presencia del contacto flotante de WhatsApp en tiendas, productos y filiales.
- Se corrige la integración para que estas secciones no queden descolgadas respecto a la home y al resto de páginas operativas.
- Se añade una partición de memoria virtual (swap) de 1 GB para reforzar la estabilidad del servidor ante picos de consumo.
- Se instala protección adicional a nivel de servidor con Monarx y Fail2ban para endurecer la seguridad operativa.

## 2026-06-01

- `filiales/toluca/index.en.html` deja de depender del CDN de Webflow para CSS, JS, logo, hero y recursos visuales principales.
- La navegación de `filiales/toluca/index.en.html` se alinea con rutas locales del proyecto cuando existe equivalente migrado.
- Se añade la migración para el bucket público `product-images` en Supabase Storage.
- Se añaden scripts para exportar y actualizar URLs de imágenes del catálogo desde un manifest JSON.

## 2026-05-31

- Se fija la estructura canónica de idiomas del sitio: ES en `index.html`, EN en `index.en.html`, y filiales siempre bajo `/filiales/<slug>/`.
- Se restaura `filiales/toluca/index.en.html` en su ubicación correcta como landing "Opening Soon".
- El card de Toluca en `filiales/index.en.html` pasa a apuntar a `/filiales/toluca/index.en.html`.
- Se despliega en producción sobre Coolify VPS con build automático desde `main`.
- Se añade subida de CV en PDF al formulario de vacantes con almacenamiento en Supabase Storage.
- Se prepara técnicamente la migración de fichas PDF a Supabase Storage con scripts y guía operativa.

## 2026-05-30

- `notify-contact` se amplía para soportar contacto general y vacantes desde un único handler.
- Se conecta y verifica Supabase para `landing_contacts` y `newsletter_signups`.
- Se importa el catálogo de productos desde Webflow CMS a Supabase.
- Se implanta el sistema SSG del catálogo con `build.js` y 138 páginas estáticas.
- Se crean páginas placeholder coherentes para blog, vacantes, entregas y eventos.
- Se convierten 73 imágenes a WebP y se actualizan sus referencias.
- Se deja operativo el trigger con Resend sobre `notify-contact`.
- Se crean versiones `.en.html` de 8 páginas y se fija la convención de rutas paralelas ES/EN.

## 2026-05-29

- Se localizan assets críticos bajo `assets/` para eliminar dependencia del CDN de Webflow en el renderizado principal.
- Se conectan los formularios de contacto y newsletter al frontend de Supabase con RLS insert-only y anti-spam inicial.
- Se integra GTM (`GTM-TWHL8PV2`) y Chatbase (Bonny) en `index.html`.
- Se elimina `landing.index.html` y se crea la estructura `filiales/` con 17 subdirectorios.
- Se fija `filiales/toluca/` como template maestro de "Nueva Apertura".
- Se crea el hub de filiales `/filiales/index.html` con grid de 17 tarjetas y CTA de WhatsApp.
- Se completa el footer del hub con newsletter, Bonny y enlace legal.
- Se crea la página de aviso de privacidad en `/legal/`.
- Se crea la home principal estática en `/index.html`.
