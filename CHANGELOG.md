# CHANGELOG

Registro oficial de cambios del proyecto AGAMA. A partir de esta fase, este archivo sustituye a `MEJORAS.md` como bitácora canónica.

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
