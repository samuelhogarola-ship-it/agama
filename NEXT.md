# NEXT — Estado del proyecto AGAMA (2026-07-04)

## Roadmap / contexto — siguiente bono SEO de 10 h

Estado: **pendiente, no aplicado**. El bloque UIX de AGAMA Online se trabaja por separado y no consume este alcance SEO futuro.

Objetivo del siguiente bono:

- Pasar de visibilidad informativa amplia (`plástico`) a tráfico con intención de producto, compra y cotización.
- Competir por búsquedas de categoría y necesidad concreta en México.
- Llevar tráfico cualificado desde landings y fichas hacia `/filiales/online/`.
- Validar con Search Console y una fuente de demanda antes de presentar cualquier referencia como “más vendida” o “más buscada”.

Clusters iniciales a investigar:

- `comprar masterbatch`, `comprar masterbatch en México`, `masterbatch negro`, `masterbatch blanco`, `masterbatch para inyección`, `masterbatch para polipropileno`.
- `comprar pigmentos para plástico`, `pigmento negro para plástico`, `pigmento blanco para plástico`, `pigmento fluorescente`, `pigmento cristal`.
- `comprar aditivos para plástico`, `protector UV para plástico`, `deslizante para plástico`, `desmoldante para plástico`, `purga para plástico`, `secante de humedad para plástico`.

Referencias de catálogo candidatas para contrastar con demanda real:

- Masterbatch: `MB-110`, `MB-115`, `MB-120`, `MB-138`, `MB-105`, `MB-200`.
- Pigmentos: `BP-1019`, `BP-2228`, `BP-106`, `BP-107`, `BP-131`, `BP-153`, `BP-645`, `BP-1001`.
- Aditivos: `AD-304`, `AD-305`, `AD-309`, `AD-310`, `AD-316`, `AD-318`, `AD-321`.

Propuesta de reparto de las 10 h:

1. **2 h — investigación y mapa de intención**
   - Cruzar Search Console, tendencias y resultados reales de búsqueda en México.
   - Separar intención informativa, categoría, compra y producto.
   - Seleccionar oportunidades por relevancia comercial, dificultad y encaje con catálogo.

2. **3 h — landings transaccionales**
   - Priorizar combinaciones validadas como masterbatch negro/blanco, pigmentos para plástico y aditivos por necesidad.
   - Evitar crear páginas sin demanda o que canibalicen categorías existentes.

3. **2 h — fichas prioritarias**
   - Reforzar hasta 10 fichas con títulos, contenido útil, preguntas de compra y enlaces internos.
   - Mantener intactos precios, especificaciones y datos técnicos salvo confirmación del cliente.

4. **2 h — conexión comercial**
   - Enlazar landings, categorías, fichas y AGAMA Online según intención.
   - Aplicar mensajes de cotización específicos por producto cuando proceda.

5. **1 h — medición y entrega**
   - Revisar sitemap, canonicales, indexabilidad y eventos de conversión.
   - Entregar listado de URLs, consultas objetivo, cambios y KPI base.

KPI propuestos:

- Impresiones y clics no de marca para categorías y necesidades prioritarias.
- Posición media y CTR de las URLs trabajadas.
- Clics en cotización por WhatsApp y uso del cotizador rápido.
- Productos añadidos al flujo de cotización.
- Consultas comerciales que generan contacto, no solo volumen informativo.

### UIX AGAMA Online — aplicado en el bloque actual

- Hero orientado a compra y cotización.
- Cotizador rápido por familia, producto, cantidad, proceso, resina y destino.
- Mensaje estructurado listo para WhatsApp.
- Acceso directo a seis soluciones destacadas sin afirmar que sean las más vendidas.
- Jerarquía comercial: cotizar → productos → cómo comprar → confianza → información institucional/pago.
- Barra de compra fija en móvil.
- Versiones ES/EN mantenidas en paralelo.
- Datos bancarios, fiscales, teléfonos y dirección conservados sin cambios.

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

### AGAMA Online — datos logísticos pendientes
Por ahora solo se confirma envío a Ciudad de México con AGAMA Express. Cualquier entrega fuera de Ciudad de México debe consultarse individualmente hasta que Ángel confirme datos operativos, cobertura, condiciones y mensajes definitivos.

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
