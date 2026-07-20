# Change Scope

## baseline

- `stable-web-2026-06-24`

## archivos permitidos

- `index.html`
- `index.en.html`
- `build.js`
- `CHANGELOG.md`
- `docs/worktree-control.json`
- `docs/change-scope.md`
- `docs/filiales-data-lock-plan.md`
- `docs/filiales-data-discrepancy-report.md`
- `scripts/validate-filiales-plan.mjs`
- `NEXT.md`
- `scripts/generate-static-blog.mjs`
- `sitemap.xml`
- `blog/index.html`
- `blog/index.en.html`
- `eventos/index.html`
- `eventos/index.en.html`
- `blog-agama/index.html`
- `contacto/index.html`
- `contacto/index.en.html`
- `assets/js/home.js`
- `assets/css/home-custom.css`
- `scripts/validate-filiales-plan.mjs`
- `entrada-de-blog/agama-en-plastimagen-2026/index.html`
- `entrada-de-blog/agama-en-plastimagen-2026/index.en.html`
- `entrada-de-blog/agama-en-meximold-2026/index.html`
- `entrada-de-blog/agama-en-meximold-2026/index.en.html`
- `entrada-de-blog/como-comparar-proveedores-de-masterbatch-durante-meximold/index.html`
- `entrada-de-blog/como-comparar-proveedores-de-masterbatch-durante-meximold/index.en.html`
- `entrada-de-blog/pigmentos-para-plastico-en-mexico-que-evaluar-antes-de-cambiar-de-proveedor/index.html`
- `entrada-de-blog/pigmentos-para-plastico-en-mexico-que-evaluar-antes-de-cambiar-de-proveedor/index.en.html`
- `entrada-de-blog/aditivos-para-plastico-en-mexico-7-preguntas-para-una-reunion-util-en-feria/index.html`
- `entrada-de-blog/aditivos-para-plastico-en-mexico-7-preguntas-para-una-reunion-util-en-feria/index.en.html`
- `entrada-de-blog/plan-de-marketing-b2b-para-ferias-industriales-en-mexico/index.html`
- `entrada-de-blog/plan-de-marketing-b2b-para-ferias-industriales-en-mexico/index.en.html`
- `entrada-de-blog/el-precio-es-una-respuesta-no-una-explicacion/index.html`
- `entrada-de-blog/en-que-momento-dejamos-de-ser-estudiantes/index.html`
- `tests/agama-smoke.spec.js`
- `tests/portal-smoke.spec.js`
- `portal/src/app/layout.tsx`
- `eventos/index.html`
- `eventos/index.en.html`
- `eventos/meximold-queretaro/index.html`
- `eventos/meximold-queretaro/index.en.html`
- `eventos/plastimagen-cdmx/index.html`
- `eventos/plastimagen-cdmx/index.en.html`
- `productos/aditivos/index.html`
- `productos/aditivos/ad-314-base-macro-batch/index.html`
- `productos/aditivos/ad-314-base-macro-batch/index.en.html`
- `filiales/chalco/index.html`
- `filiales/chalco/index.en.html`
- `filiales/cuautitlan/index.html`
- `filiales/cuautitlan/index.en.html`
- `filiales/ecatepec/index.html`
- `filiales/ecatepec/index.en.html`
- `filiales/ermita/index.html`
- `filiales/ermita/index.en.html`
- `filiales/guadalajara/index.html`
- `filiales/guadalajara/index.en.html`
- `filiales/leon/index.html`
- `filiales/leon/index.en.html`
- `filiales/merced/index.html`
- `filiales/merced/index.en.html`
- `filiales/monterrey/index.html`
- `filiales/monterrey/index.en.html`
- `filiales/online/index.html`
- `filiales/online/index.en.html`
- `filiales/pantitlan/index.html`
- `filiales/pantitlan/index.en.html`
- `filiales/puebla/index.html`
- `filiales/puebla/index.en.html`
- `filiales/queretaro/index.html`
- `filiales/queretaro/index.en.html`
- `filiales/san-luis-potosi/index.html`
- `filiales/san-luis-potosi/index.en.html`
- `filiales/texcoco/index.html`
- `filiales/texcoco/index.en.html`
- `filiales/tlahuac/index.html`
- `filiales/tlahuac/index.en.html`
- `filiales/zaragoza/index.html`
- `filiales/zaragoza/index.en.html`
- `filiales/index.html`
- `filiales/index.en.html`
- `filiales/toluca/index.html`
- `filiales/toluca/index.en.html`

## carpetas permitidas

- `assets/img/`
- `assets/video/`

## cambios prohibidos

- `main`
- `public/`
- `components/`
- `app/`
- `pages/`
- `entregas/`
- `wordpress/`
- `wp.zip`
- `agama-web.webflow/`

## notas

- Este alcance permite además una optimización acotada de rendimiento para la home y la plantilla compartida de productos: hero en vídeo, fuentes, recursos críticos e imágenes del home, sin cambios de contenido, SEO, formularios ni nuevas funcionalidades.
- `scripts/generate-static-blog.mjs` debe preservar los posts manuales que no existen en el snapshot histórico.
- `sitemap.xml` puede recibir la entrada `agama-en-plastimagen-2026` y cualquier post nuevo publicado.
- El post `en-que-momento-dejamos-de-ser-estudiantes` puede publicarse cuando el propietario lo autorice: cambiar robots a `index,follow`, añadir al índice y sitemap.
- Las filiales físicas pueden recibir el bloque visual compartido de información de sucursal, manteniendo intactos sus datos, metadata SEO, JSON-LD y contenido local ya publicado. No se tocan entregas, Webflow legacy ni `wp.zip`.
- Las confirmaciones humanas de Cuautitlán y Toluca pueden sincronizarse en ES/EN, hub, mapas, JSON-LD y baseline. El baseline añade WhatsApp como campo independiente del teléfono para impedir regresiones posteriores.
- Excepción puntual: se permite añadir el enlace global `Eventos/Events` en el header principal, el hub de eventos y las plantillas compartidas del catálogo y blog estático.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- Este alcance permite actualizar el precio de `AD-314 BASE MACRO BATCH` de `$24 MXN` a `$25 MXN` en la ficha ES/EN, schema Product y listado de aditivos, manteniendo el resto del catálogo intacto.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
- Este alcance permite ajustar la cabecera de `contacto/` ES/EN para corregir legibilidad del H1 en móvil y reducir carga inicial de la intro visual, sin modificar formularios ni datos de contacto.
- Excepción puntual adicional: se permite actualizar enlaces canónicos de Google Maps y `hasMap` en las fichas de filiales ya confirmadas por el usuario, junto con su baseline documental y validación automatizada asociada.
- Excepción puntual adicional: se permite añadir el ID GA4 `G-QV3KKP101K` al layout global del portal Next y protegerlo con smoke test, sin tocar rutas ni lógica comercial.
