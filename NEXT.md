# NEXT — Estado del proyecto AGAMA (2026-07-27)

## Prioridad actual — poner AGAMA en primera línea de Google

La ejecución SEO técnica de 10 h ya está implementada y mergeada por bloques. El sitio tiene ahora:

- `/masterbatch/` como landing SEO principal para `masterbatch México` y `masterbatches México`.
- `/pigmentos/` como landing SEO para `pigmentos México`.
- `/aditivos/` como landing secundaria para `aditivos para plástico en México`.
- `/productos/` y categorías como catálogo público indexable.
- `/filiales/online/` como destino comercial estable.
- Enlazado entre home, landings, catálogo, FAQs, blog y AGAMA Online.
- Refuerzo extra de `/masterbatch/` con contenido semántico, FAQ visible/schema y enlaces internos.

Estado observado por negocio:

- `pigmentos México`: AGAMA ya aparece en primera página.
- `masterbatch México`: AGAMA sigue alrededor de segunda página; hay que empujar indexación, autoridad interna y señal comercial de la URL `/masterbatch/`.

### Qué falta del plan SEO

1. **Search Console / indexación manual**
   - Inspeccionar `https://www.agama.com.mx/masterbatch/`.
   - Ejecutar “Probar URL publicada”.
   - Si es indexable, pulsar “Solicitar indexación”.
   - Repetir para las URLs prioritarias listadas abajo.

2. **Sitemap y rastreo**
   - Confirmar que `https://www.agama.com.mx/sitemap.xml` está enviado en Search Console.
   - Revisar que Google lo haya leído después del último merge.
   - Si Search Console lo permite, reenviar sitemap.

3. **Monitorización de canonical elegido por Google**
   - Para `/masterbatch/`, comprobar en Inspección de URL:
     - canonical declarado: `https://www.agama.com.mx/masterbatch/`;
     - canonical elegido por Google: debe coincidir;
     - estado: indexable / en cola / indexada.
   - Si Google elige otra URL, revisar canibalización con `/productos/masterbatch/` o posts antiguos.

4. **Medición de ranking real**
   - Registrar posición semanal en modo incógnito y, si es posible, desde Search Console:
     - `masterbatch México`;
     - `masterbatches México`;
     - `masterbatch para plástico en México`;
     - `pigmentos México`;
     - `pigmentos para plástico en México`.

5. **Autoridad externa**
   - Conseguir enlaces reales hacia `/masterbatch/` desde perfiles, proveedores, publicaciones o fichas comerciales donde sea natural.
   - Evitar enlaces artificiales o granjas de links.

### URLs que conviene solicitar a indexación manual

Prioridad 1:

- `https://www.agama.com.mx/masterbatch/`
- `https://www.agama.com.mx/productos/masterbatch/`
- `https://www.agama.com.mx/faqs/`

Prioridad 2:

- `https://www.agama.com.mx/pigmentos/`
- `https://www.agama.com.mx/productos/pigmentos/`
- `https://www.agama.com.mx/aditivos/`
- `https://www.agama.com.mx/productos/aditivos/`

Blog relacionado con masterbatch:

- `https://www.agama.com.mx/entrada-de-blog/que-es-un-pigmento-y-que-es-un-masterbatch/`
- `https://www.agama.com.mx/entrada-de-blog/003-que-es-un-vehiculo/`
- `https://www.agama.com.mx/entrada-de-blog/004-como-formulamos-los-masterbatch-de-linea/`
- `https://www.agama.com.mx/entrada-de-blog/como-comparar-proveedores-de-masterbatch-durante-meximold/`

### Nota importante sobre el ID de Analytics

El ID de Google Analytics `G-QV3KKP101K` ya sirve para medición, pero **no sirve para solicitar indexación**. Para empujar indexación se necesita Google Search Console con permisos sobre `agama.com.mx`.

Con acceso de Search Console se puede hacer:

- inspección manual de URL;
- solicitud manual de indexación;
- envío/reenvío de sitemap;
- revisión de canonical elegido por Google;
- seguimiento de consultas, impresiones, CTR y posición media.

Con código/API se puede ayudar a:

- inspeccionar estado si hay OAuth de Search Console;
- reenviar sitemap si hay permiso API;
- auditar sitemap/canonical/HTTP.

Pero la solicitud directa de indexación de una landing normal no se hace con el ID de Analytics ni con la Indexing API general.

### Próximo bloque recomendado para subir `masterbatch México`

Duración sugerida: 2–4 h.

Alcance:

- Verificar en Search Console estado exacto de `/masterbatch/`.
- Solicitar indexación de `/masterbatch/` y URLs relacionadas.
- Revisar si Google está mostrando otra URL para la intención `masterbatch México`.
- Si hay canibalización, ajustar títulos/enlaces internos de forma quirúrgica.
- Añadir 1 pieza editorial corta o bloque FAQ adicional solo si Search Console muestra falta de cobertura temática.
- No tocar catálogo, fichas, slugs, precios ni `/online/`.

Resultado esperado:

- Google descubre o recrawlea `/masterbatch/` más rápido.
- La URL correcta compite por `masterbatch México`.
- Se separa intención informativa-comercial de `/masterbatch/` frente a intención transaccional de `/productos/masterbatch/`.
- Se mide avance sin cambios grandes ni riesgo de romper rutas.

## AGAMA Marketplace — estado paralelo

Repo separado: `~/Desktop/webs/agama-marketplace` · Deploy: `agama-marketplace.vercel.app`  
Estado: **~55% del MVP lanzable** — catálogo + auth + watcher IA construidos; mensajería pendiente.

Dos bloqueantes de dashboard para onboardear el primer proveedor real:
1. **SMTP en Supabase** (`iaglqispczaoduoodzwx` → Auth → SMTP) — sin esto signup no manda emails.
2. **`ANTHROPIC_API_KEY` en Vercel** — sin esto la IA de moderación no corre (solo regex).

Ver estado detallado en `~/Desktop/webs/agama-marketplace/NEXT.md`.

---

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
