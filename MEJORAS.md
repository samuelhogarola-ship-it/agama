# MEJORAS — Registro de cambios y mejoras

Historial de decisiones, mejoras y cambios aplicados al sitio estático de AGAMA.

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

## Pendientes

- [ ] Crear `index.html` raíz — home principal de agama.com.mx estática.
- [ ] Crear proyecto Supabase de AGAMA y ejecutar `supabase/landing-schema.sql`.
- [ ] Confirmar y documentar licencia de redistribución de fonts en `ASSET_PROVENANCE.md`.
- [ ] Agregar link a `/filiales/` en el nav de las páginas de filiales individuales (actualmente apunta a Webflow).
- [ ] Internacionalización: versión EN del hub de filiales (`filiales/index.en.html`).
