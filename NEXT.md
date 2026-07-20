# NEXT — Estado del proyecto AGAMA (2026-07-04)

## PRs abiertas ahora mismo

| PR | Branch | Estado | Notas |
|----|--------|--------|-------|
| #84 | `feat/online-store-functional` | Listo para merge | Mergear **después de #83**. Transforma AGAMA Online: hero CTAs, tarjetas de oferta enlazadas, "Cómo pedir" (4 pasos), FAQ 5 actualizada, Google Reviews restaurado. ES + EN. |
| #83 | `feat/filiales-schema-org` | Listo para merge | Schema.org `LocalBusiness` JSON-LD en las 16 filiales que no lo tenían. Mergear **primero**. |
| #82 | `feat/agama-online-seo` | DRAFT — bloqueado | Bloqueado: render visual del bucket en `filiales/online/` tiene TODO(codex). Necesita imagen con fondo transparente o rediseño. |
| #81 | `feat/configurador-app-promo` | Listo, NO mergear | Chip glassmorphism en hero de home. **No debe integrarse en producción por ahora.** |

### PRs antiguas (junio 2026) — revisar y cerrar stale

#23, #25, #27, #34, #37, #47, #48, #51, #54, #55, #66, #67 — posiblemente supersedidas o con conflictos. Revisar cuáles siguen siendo relevantes.

---

## Inmediato — tras mergear #83 y #84

- **Blog — segundo post**: `en-que-momento-dejamos-de-ser-estudiantes` listo para publicar el **2026-07-06**. Para publicarlo: cambiar `noindex,nofollow,noarchive` → `index,follow`, añadir a `/blog/` y `/blog-agama/`, actualizar `sitemap.xml`.
- **Merced**: añadir teléfono al JSON-LD cuando el dato esté confirmado (`filiales/merced/index.html` + `index.en.html`).
- **Coordenadas geo**: validar coordenadas aproximadas de las 16 filiales contra Google Maps / GBP.

---

## Pendiente estructural

### QR de productos (sin resolver)
Los QR impresos en producto físico no funcionan. Verificar a qué URLs apuntan y si esas rutas existen y devuelven 200. Ver también `QR para filiales/` en la raíz del repo.

### Google reviews — estrategia de captación
Cuautitlán tiene 0 reseñas. El botón "Valorar en Google" ya está en el hero de AGAMA Online. Falta extenderlo a filiales físicas: QR en tienda, WhatsApp post-compra, etc.

### DNS cutover (bloqueado en cliente)
- `www.agama.com.mx` → pedir a Cayman que apunte a `2.24.10.239` y añadir el dominio en Coolify.
- Newsletter Resend: verificar dominio `agama.com.mx` en resend.com/domains para envío a suscriptores externos.

### Formularios en producción
Confirmar en entorno publicado que contacto, newsletter (home + blog) y vacantes guardan en Supabase y notifican correctamente.

### PR #82 — desbloquear AGAMA Online SEO
Necesita renders del bucket de imágenes con fondo transparente. Sin eso el visual queda roto.

---

## No bloqueante para go-live

- 5 fichas de producto sin PDF origen (pendiente del dueño): `ad-304`, `ad-313`, `ad-314`, `ad-315`, `ad-316`. No deben mostrar enlace roto.
- 5 productos sin tercera visual histórica: `mb-153-mb-cafe-chocolate`, `ad-310`, `ad-311`, `ad-312`, `ad-320`.
- `/eventos/`: switch de idioma EN desaparece al hacer scroll — anclar al nav fijo.
- Formularios: cambiar destinatario definitivo de `ceo@agamaeu.com` al correo principal del cliente tras el corte.

---

## Después del corte estable

- Preparar matriz de redirecciones desde URLs/dominio antiguo.
- Cloudflare, Coolify detrás de dominio, endurecimiento SSH, backups externos.
- Retomar WordPress solo si el cliente quiere gestión editorial desde panel.
- Configurador de colores: definir cuándo y cómo integrarlo en producción (PR #81, actualmente bloqueado).
