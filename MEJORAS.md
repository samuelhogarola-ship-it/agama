# MEJORAS — Registro de cambios y mejoras

Historial de decisiones, mejoras y cambios aplicados al sitio estático de AGAMA.

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
- Formulario `/contacto/` escribe en `landing_contacts` → notificación a `ventas@agama.com.mx` pendiente de configurar en Supabase (webhook o trigger).

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
- Sin contenido — pendiente decisión sobre plataforma de blog y fuentes de datos.

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
- Insert de prueba verificado: email recibido en `ventas@agama.com.mx`.
- Remitente provisional: `onboarding@resend.dev` (pendiente verificar dominio `agama.com.mx`).

---

## Pendientes

- [ ] **Deploy** — configurar servidor (VPS/Hostinger) y CI/CD para `npm run build` automático en push.
- [ ] **Dominio Resend** — verificar `agama.com.mx` para que emails salgan de `noreply@agama.com.mx`.
- [ ] **Supabase AGAMA** — ejecutar `supabase/landing-schema.sql` en el proyecto real (tablas `landing_contacts` y `newsletter_signups` ya aplicadas, trigger pendiente de estabilizar con pg_net).
- [ ] **Blog** — decidir si se mantiene en WP o se migra. Mientras, placeholder activo.
- [ ] **Vacantes / Entregas / Eventos** — rellenar con contenido real cuando esté disponible.
- [ ] **PDFs fichas técnicas** — descargar de CDN Webflow y subir a Supabase Storage antes de dar de baja Webflow.
- [ ] **Versión EN** — internacionalización del hub de filiales y páginas de producto.
- [ ] **ASSET_PROVENANCE.md** — confirmar licencia de redistribución de fonts de Webflow.
- [ ] **Responsive audit** — revisar puntuaciones PageSpeed tras mejoras WebP y reducción de hero.
