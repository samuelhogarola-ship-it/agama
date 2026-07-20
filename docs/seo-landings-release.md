# SEO y conversión: registro de entrega escalonada

## Alcance implementado

Esta entrega mantiene `/productos/` como catálogo público y `/filiales/online/` como destino comercial. No modifica datos, precios, consultas a Supabase, slugs ni fichas técnicas. `/online/` continúa fuera del flujo.

| Bloque | Rutas principales | Cambio reversible | Comprobación previa a publicar |
| --- | --- | --- | --- |
| SEO crítico | `/sitemap.xml`, `/blog/`, redirects históricos | Restaurar sitemap, metadatos y bloque de redirects anterior | `npm run audit:seo` y muestras HTTP |
| Masterbatch | `/masterbatch/` | Retirar página, entrada de sitemap y enlaces de entrada | Title, canonical, H1, schema, móvil y CTAs |
| Pigmentos y aditivos | `/pigmentos/`, `/aditivos/` | Retirar cada landing de forma independiente | Contenido único, canonical, H1, móvil y CTAs |
| Conversión | Home, `/productos/` y tres categorías | Retirar solo los bloques contextuales | Catálogo, buscador, fichas y WhatsApp sin regresiones |

## Mapa de intención

| URL | Intención principal | Title | H1 | Siguiente paso |
| --- | --- | --- | --- | --- |
| `/masterbatch/` | `masterbatch México`, `masterbatches México` | `Masterbatch en México \| AGAMA` | `Masterbatch en México para la industria del plástico` | `/productos/masterbatch/` |
| `/pigmentos/` | `pigmentos México`, `pigmentos para plástico en México` | `Pigmentos en México \| AGAMA` | `Pigmentos en México para la industria del plástico` | `/productos/pigmentos/` |
| `/aditivos/` | `aditivos para plástico en México` | `Aditivos para plástico en México \| AGAMA` | `Aditivos para plástico en México` | `/productos/aditivos/` |

Las landings explican y orientan; las categorías conservan la intención transaccional y las descripciones por producto. Así se evita replicar el catálogo en páginas indexables nuevas.

## Decisión sobre el blog

El índice `/blog/` conserva todas las entradas enlazadas desde `/blog-agama/` y añade contenido más reciente. Por ello `/blog/` queda como índice canónico y ambas variantes de `/blog-agama` redirigen en un solo salto a `/blog/`. El directorio legacy permanece en el artefacto como respaldo, pero no se publica en sitemap.

## Orden de publicación y rollback

1. Publicar SEO crítico y validar sitemap, canonicales y redirects.
2. Publicar `/masterbatch/` y validar antes de continuar.
3. Publicar `/pigmentos/`; publicar `/aditivos/` solo si conserva su contenido propio.
4. Publicar el enlazado contextual.
5. Ejecutar build, auditoría SEO, pruebas públicas y revisión visual final.

Ante una regresión, se revierte exclusivamente el bloque más reciente o se restaura el artefacto anterior. No se continúa con el siguiente bloque mientras haya rutas, canonicales, enlaces o vistas móviles fallando. Este procedimiento no requiere `reset`, rebase ni reescritura del historial.

## Fuera de alcance

No se incluye el portal `/online/`, autenticación, RLS, migraciones de Supabase, cambios masivos de fichas, nuevas traducciones, rediseño general, movimiento de rutas, monitorización orgánica posterior ni despliegue automático.
