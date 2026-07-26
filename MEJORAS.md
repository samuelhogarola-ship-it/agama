# MEJORAS — Registro de cambios y mejoras

> Archivo legado. El registro oficial de cambios del proyecto pasa a ser [CHANGELOG.md](/Users/sam/.codex/worktrees/5792/AGAMA/CHANGELOG.md). `MEJORAS.md` se conserva solo como histórico y no debe recibir entradas nuevas.

Historial de decisiones, mejoras y cambios aplicados al sitio estático de AGAMA.

---

## [2026-06-17] Sincronización de WhatsApp por filial

- Los CTAs de WhatsApp en páginas de `filiales` ahora toman el número visible en el bloque de contacto de cada ficha, en lugar de depender de un `wa.me` fijo compartido.
- El botón flotante de WhatsApp también quedó alineado con el número de la filial activa.
- Zaragoza no se modificó a nivel de contenido; conserva el dato que ya tenga publicado en su propia ficha.

---

## [2026-06-15] Restauración de datos fiscales y bancarios en filiales

- Restaurado un bloque visible de `Datos fiscales y bancarios` en todas las páginas de `filiales`.
- Fuente restaurada: contenido histórico de `https://www.agama.com.mx/tiendas`.
- Cada sucursal recupera su titular fiscal, RFC, banco, cuenta y cuenta interbancaria según el producto antiguo.
- `Toluca` no tenía ficha histórica en `/tiendas`; se reutilizaron los datos corporativos de `Agama Online` para no dejar la nueva filial sin referencia fiscal/bancaria.

---

## [2026-05-30] Edge Function notify-contact — soporte dual contacto + vacantes

- `notify-contact` actualizada para manejar dos tipos de registros en un solo handler.
- Contacto general (`landing_contacts`): campos name, company, email, phone, subject, message → asunto `[AGAMA Web]`.
- Solicitudes de empleo (`job_applications`): campos vacancy, phone_mobile, phone_fixed, city_state, postal_code, social_links → asunto `[AGAMA Vacante]`.
- Detección automática por campo `vacancy` o por `table` en el payload.
- Destino fijo: `ceo@agamaeu.com`. Botón "Responder a" preconfigurado en el email.
- Deployed a `ozexoekvshuhtkrleuze` (proyecto Supabase AGAMA).

---

## [2026-05-29] Merge PR #3 — Refactor home para VPS y Supabase

- Assets (CSS, JS, fonts, imágenes, vídeo) localizados bajo `assets/` — sin dependencia del CDN de Webflow para renderizado crítico.
- Formularios de contacto y newsletter conectados al frontend de Supabase (insert-only, RLS activo).
- Anti-spam fase 1: honeypot + delay mínimo en submit.
- SQL schema (`supabase/landing-schema.sql`) listo para ejecutar en el proyecto Supabase de AGAMA cuando se cree.
- GTM (`GTM-TWHL8PV2`) y Chatbase (Bonny) ya integrados en `index.html`.

---

## [2026-05-29] Estructura de filiales

- Eliminado `landing.index.html` (versión obsoleta).
- Creada carpeta `filiales/` con 17 subdirectorios, uno por sucursal.
- `filiales/toluca/` — landing "Nueva Apertura" bloqueada como template maestro. No modificar sin intención.
- Las 16 filiales restantes generadas desde el template con nombre y dirección de cada sucursal.
- URLs limpias: `agama.com.mx/filiales/{slug}/`.

### Filiales creadas
| Slug | Nombre |
|---|---|
| toluca | Agama Toluca (próxima apertura) |
| chalco | Agama Chalco |
| cuautitlan | Agama Cuautitlán |
| ecatepec | Agama Ecatepec |
| ermita | Agama Ermita |
| guadalajara | Agama Guadalajara |
| leon | Agama León |
| merced | Agama Merced |
| monterrey | Agama Monterrey |
| online | Agama Online |
| pantitlan | Agama Pantitlán |
| puebla | Agama Puebla |
| queretaro | Agama Querétaro |
| san-luis-potosi | Agama San Luis Potosí |
| texcoco | Agama Texcoco |
| tlahuac | Agama Tláhuac |
| zaragoza | Agama Zaragoza |

---

## [2026-05-29] Hub de filiales — `/filiales/index.html`

- Grid responsivo de 17 tarjetas con nombre, dirección e icono `location_on`.
- Toluca marcada con badge "Próxima apertura" en color ámbar.
- CTA de WhatsApp al pie para zonas no cubiertas.
- Nav y footer idénticos al resto del sitio.
- `margin-top: 95px` en el hero para compensar el nav fixed.

---

## [2026-05-29] Footer completo en hub de filiales

- Añadido newsletter (formulario con anti-spam honeypot) al footer del hub, igual que en landing.
- Añadido embed de Bonny (Chatbase `syhmjssLBRg1bJZYYj3ag`) al hub y a la página legal.
- Añadido enlace **Legal** en el `footer-legal` de todas las páginas nuevas → `/legal/`.

---

## [2026-05-29] Página de Aviso de Privacidad — `/legal/`

- Creada `legal/index.html` con el contenido completo del aviso de privacidad de Dorcil de Jhomms SA de CV (AGAMA®).
- Fuente: `https://www.agama.com.mx/aviso-de-privacidad`.
- Incluye: identidad del responsable, datos recabados, finalidades primarias y secundarias, derechos ARCO, INAI, actualización y aceptación.
- Misma estructura de nav/footer que el resto del sitio estático.

---

## [2026-05-29] Home principal — `/index.html`

- Creada la home principal estática que reemplaza el `index.html` de Toluca en la raíz.
- Secciones: Hero (vídeo), Productos (3 tarjetas), Mosaico de servicios (4 cards), Blog CTA, CTA final, Footer.
- Vídeo de fondo local (`assets/video/agama-video-bg-transcode.*`), sin dependencia de CDN.
- Secciones dinámicas (FAQs, Eventos) omitidas — el contenido vive en agama.com.mx/blog y agama.com.mx/eventos.
- Newsletter, Bonny y Legal replicados igual que en el hub de filiales.
- Schema.org `Organization` añadido en `<head>`.

---

## [2026-05-30] Supabase conectado y verificado

- Proyecto: `ozexoekvshuhtkrleuze` (cuenta `ceo@agamaeu.com`)
- URL: `https://ozexoekvshuhtkrleuze.supabase.co`
- Schema aplicado: `landing_contacts` + `newsletter_signups`
- RLS: insert-only para anon y authenticated. Sin SELECT público.
- Insert de prueba verificado OK desde CLI.
- `supabase-config.js` ya tiene las credenciales correctas (publishableKey).
- Formulario `/contacto/` escribe en `landing_contacts` → notificación centralizada en `ceo@agamaeu.com`.

---

## [2026-05-30] Catálogo de productos importado desde Webflow CMS

- Export de Webflow descargado (135 productos activos).
- Tabla `public.products` creada en Supabase con RLS (SELECT público, INSERT/UPDATE solo authenticated).
- 135 productos importados: 64 pigmentos, 52 masterbatch, 19 aditivos.
- Campos: nombre, slug, tipo_producto, tipo, acabado, color, precio, descripción, información (HTML), ficha técnica (PDF URL), portada, galería.
- Endpoint público: `https://ozexoekvshuhtkrleuze.supabase.co/rest/v1/products`.

---

## [2026-05-30] SSG Build System — 138 páginas estáticas

- `build.js`: script Node.js 18+ sin dependencias externas.
- Fetch de los 135 productos desde Supabase **en build time** (no en el navegador).
- Genera `dist/` con:
  - `/productos/pigmentos/index.html` — listado pre-renderizado (64 tarjetas en HTML)
  - `/productos/masterbatch/index.html` — 52 tarjetas
  - `/productos/aditivos/index.html` — 19 tarjetas
  - `/productos/{tipo}/{slug}/index.html` — 135 páginas individuales de producto
- SEO completo por producto: `<title>` único, `<meta description>`, `canonical`, Open Graph, Twitter Card, `Schema Product`, `BreadcrumbList`.
- Cero `fetch()` cliente para contenido principal. JS cliente solo para filtro de búsqueda (opera sobre DOM pre-renderizado).
- Comando: `npm run build` → 138 páginas en ~1.3s.
- Veredicto: **A) Catálogo 100% estático generado desde Supabase en build**.

---

## [2026-05-30] Páginas placeholder — blog, vacantes, entregas, eventos

- 4 páginas con diseño consistente: nav completo, hero con icono Material, badge "Próximamente", CTA WhatsApp, footer.
- Canonical, GTM, Bonny incluidos.
- Migración definida: el blog se moverá de Webflow a WordPress preservando el diseño actual.

---

## [2026-05-30] Imágenes a WebP

**WebP:**
- 73 imágenes convertidas de `.jpg/.png` a `.webp` con Pillow (quality 82).
- Reducción media ~70% de peso.
- Referencias actualizadas en 27 archivos HTML y `build.js`.
- Imágenes más destacadas: `asistente.png` 1.2MB → 60KB, `cta-bg.jpg` 319KB → 56KB.

---

## [2026-05-30] Supabase AGAMA — trigger Resend operativo

- Edge Function `notify-contact` deployada en `ozexoekvshuhtkrleuze`.
- `RESEND_API_KEY` configurada como secret.
- Trigger SQL `on_contact_insert` en `landing_contacts` → llama a `notify-contact`.
- Insert de prueba verificado: email recibido en `ceo@agamaeu.com`.
- Remitente provisional: `onboarding@resend.dev` (pendiente verificar dominio `agama.com.mx`).

---

## [2026-05-30] Traducción al inglés — 8 páginas (`feature/english-translation`, PR #13)

- Creadas versiones `.en.html` de 8 páginas: `index`, `contacto`, `filiales`, `vacantes`, `entregas`, `eventos`, `blog`, `legal`.
- Convención: cada ruta tiene `index.html` (ES) e `index.en.html` (EN) en paralelo.
- Nav, footer y contenido completamente traducidos al inglés.
- Botón flotante de WhatsApp (`mesenger-hldr` + clase `messenger`) añadido a todas las páginas EN.
- Links internos entre páginas EN usan sufijo `.en.html`.
- Revisión PR aplicada:
  - `rel="noopener noreferrer"` en todos los `target="_blank"`.
  - Año del footer actualizado a 2026.
  - `legal/index.en.html`: eliminado CVV/código de seguridad de la lista de datos financieros.
  - `aria-label` y `alt` descriptivos en los enlaces de imagen del megamenu de productos.

## [2026-05-31] Estructura de idiomas y landing Toluca EN restaurada

### Regla de estructura de idiomas (canónica)

| Archivo | Idioma | Descripción |
|---|---|---|
| `/index.html` | ES 🇲🇽 | Homepage principal (español — mercado primario) |
| `/index.en.html` | EN 🇺🇸 | Homepage principal en inglés |
| `/filiales/<slug>/index.html` | ES | Landing por sucursal en español |
| `/filiales/<slug>/index.en.html` | EN | Landing por sucursal en inglés |

**Reglas fijas:**
- El idioma por defecto del sitio es **español** (mercado México).
- Las páginas EN del sitio principal viven en la **raíz** con sufijo `.en.html`.
- Las páginas de sucursal (filiales) viven **siempre** bajo `/filiales/<slug>/`, nunca en la raíz.
- **Nunca crear** una landing de apertura de filial en la raíz del proyecto.

### Toluca EN
- `filiales/toluca/index.en.html` — landing "Opening Soon" de Toluca restaurada en su ubicación correcta (contenido idéntico al original pre-PR).
- `filiales/toluca/index.html` — landing "Nueva Apertura" en español, sin cambios.
- El card de Toluca en `filiales/index.en.html` ahora apunta a `/filiales/toluca/index.en.html`.

---

## [2026-05-31] Deploy en producción — Coolify VPS

- **Servidor:** Hostinger VPS con Coolify v4.
- **Trigger:** push a `main` → build automático → rolling update sin downtime.
- **Build:** `Dockerfile` (node:20-alpine compila `dist/`, nginx:alpine lo sirve).
- **Variables de entorno:** `SUPABASE_URL` y `SUPABASE_ANON_KEY` configuradas en Coolify.
- **URL temporal:** `http://e9x7k0zb6cg5zuas3zj2apug.2.24.10.239.sslip.io` (pendiente dominio real).
- Guía de deploy y onboarding de nuevos proyectos en `docs/core-general.md`.

---

## [2026-05-31] CV upload en formulario de vacantes

- Campo de archivo PDF añadido al formulario de `vacantes/jefe-de-reclutamiento-y-seleccion/`.
- Restricciones: 1 archivo, solo PDF, máx. 5 MB. Validación en cliente antes de enviar.
- Flujo: el PDF se sube a Supabase Storage (bucket `cvs`, privado) → se guarda la URL en `job_applications.cv_url`.
- Migración aplicada: columna `cv_url text` en `job_applications` + policies de Storage.
- El aviso del formulario actualizado: ya no dice "no es posible adjuntar archivos".

---

## [2026-06-06] Bonny / WhatsApp en tiendas, productos y filiales

- Durante la revisión de migración se detectó que tiendas, productos y filiales no tenían integrado de forma homogénea ni el acceso de contacto por WhatsApp ni el soporte visible del asistente.
- Se unificó la presencia del contacto flotante de WhatsApp en toda la web.
- Se dejó corregida la integración para que estas secciones ya no queden descolgadas respecto a la home y al resto de páginas operativas.

---

## [2026-06-06] Mejora de estabilidad del servidor

### Configuración de memoria virtual (Swap) de 1 GB

- Se ha añadido y configurado una partición de memoria virtual (Swap) para aumentar la tolerancia del servidor ante picos de consumo de memoria.

### Beneficios

- Reduce el riesgo de caídas o reinicios inesperados por falta de memoria.
- Mejora la estabilidad general del servicio.
- Aporta una capa adicional de seguridad operativa ante procesos que consuman más recursos de lo previsto.
- Minimiza la posibilidad de interrupciones en la web durante tareas intensivas o situaciones excepcionales.
- Configuración permanente, activa incluso tras reinicios del servidor.

### Resultado

- Servidor más robusto y preparado para absorber cargas puntuales sin afectar al funcionamiento normal de la web.
- Instalación de Malware Monarx para reforzar la protección del servidor frente a amenazas, malware y comportamientos sospechosos a nivel de sistema.

### Protección frente a ataques de fuerza bruta

- Instalación y configuración de Fail2ban.
- Monitorización continua de accesos SSH.
- Detección automática de intentos repetidos de autenticación.
- Bloqueo temporal de direcciones IP sospechosas.
- Integración con el firewall del servidor para reforzar la seguridad de acceso remoto.

---

## Pendientes

- [x] **Deploy** — Coolify v4 en Hostinger VPS. Cada push a `main` dispara build automático (Dockerfile: node:20-alpine → nginx:alpine). Ver guía completa en `docs/core-general.md`.
- [ ] **Emails / Resend** — mantener por ahora el destino operativo `ceo@agamaeu.com`. No tocar el email principal ni cambiar a remitente de dominio hasta que la migración esté funcionando completa; después verificar `agama.com.mx` en Resend y pasar a un remitente tipo `noreply@agama.com.mx`.
- [ ] **Supabase AGAMA** — ejecutar `supabase/landing-schema.sql` en el proyecto real (tablas `landing_contacts` y `newsletter_signups` ya aplicadas, trigger `pg_net` pendiente de revisar solo si las notificaciones vuelven a depender del trigger SQL).
- [ ] **Blog / WordPress** — crear `wp.zip` base para la migración desde Webflow a WordPress replicando el diseño actual.
- [ ] **Vacantes / Entregas / Eventos** — rellenar con contenido real cuando esté disponible.
- [x] **PDFs fichas técnicas** — 130 fichas migradas a Supabase Storage y catálogo regenerado sin enlaces PDF a Webflow.
- [ ] **PDFs fichas técnicas faltantes** — conseguir o generar PDF para `ad-304-protector-uv`, `ad-314-base-macro-batch`, `ad-315-phenil-o`, `ad-316-w-slip`.
- [x] **filiales/toluca/index.en.html** — landing EN de apertura de Toluca restaurada en su ubicación correcta.
- [ ] **ASSET_PROVENANCE.md** — confirmar licencia de redistribución de fonts de Webflow.
- [ ] **Responsive audit** — revisar puntuaciones PageSpeed tras mejoras WebP y reducción de hero.

---

## [2026-05-31] Preparación técnica — fichas PDF a Supabase Storage

- Añadida migración para bucket público `product-tech-sheets` en Supabase Storage.
- Añadido script `scripts/update-tech-sheet-urls.mjs` para actualizar `public.products.ficha_tecnica` desde un manifest JSON.
- Añadida plantilla `data/tech-sheets-manifest.example.json`.
- Añadida guía operativa en `docs/tech-sheets-migration.md`.
- No se cambiaron URLs reales todavía: falta subir los PDFs y ejecutar el script con `SUPABASE_SERVICE_ROLE_KEY`.

---

## [2026-06-01] Toluca EN y preparación de imágenes de catálogo

- `filiales/toluca/index.en.html` ya no depende del CDN de Webflow para CSS, JS, logo, hero y recursos visuales principales.
- La navegación de `filiales/toluca/index.en.html` quedó alineada con rutas locales del proyecto cuando existe equivalente migrado.
- Añadida migración para bucket público `product-images` en Supabase Storage.
- Añadido script `scripts/export-product-images-manifest.mjs` para exportar `slug`, `portada` y `galeria` del catálogo actual.
- Añadido script `scripts/update-product-image-urls.mjs` para actualizar `public.products.portada` y `public.products.galeria` desde un manifest JSON.
- Añadida plantilla `data/product-images-manifest.example.json`.
- Añadida guía operativa en `docs/product-images-migration.md`.
- Objetivo del siguiente bloque: sacar las imágenes de producto de `cdn.prod.website-files.com` y cerrar la dependencia remanente de Webflow en el catálogo.
