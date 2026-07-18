# CHANGELOG

Registro oficial de cambios del proyecto AGAMA. A partir de esta fase, este archivo sustituye a `MEJORAS.md` como bitácora canónica.

## 2026-07-18

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
