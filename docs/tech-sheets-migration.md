# Fichas Técnicas → Supabase Storage

Guía breve para dejar de depender del CDN de Webflow en `products.ficha_tecnica`.

## 1. Aplicar la migración de Storage

Migración:

- `supabase/migrations/20260531210000_product_tech_sheets_storage.sql`

Esto crea el bucket público `product-tech-sheets`. La lectura es pública, pero insert/update/delete quedan restringidos a rutas de administración con `service_role`.

## 2. Subir los PDFs

Convención recomendada:

- `product-tech-sheets/pigmentos/<slug>.pdf`
- `product-tech-sheets/masterbatch/<slug>.pdf`
- `product-tech-sheets/aditivos/<slug>.pdf`

## 3. Preparar el manifest

Base automática:

```bash
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
npm run tech-sheets:export
```

Eso genera `data/tech-sheets-manifest.json` con:

- `sourceUrl` cuando el catálogo actual ya tiene un PDF en Webflow
- `skip: true` cuando hoy no existe PDF origen y conviene no actualizar esa ficha todavía

Plantilla manual:

- `data/tech-sheets-manifest.example.json`

Formato por producto:

```json
[
  {
    "slug": "mb-101-mb-amarillo-huevo",
    "bucketPath": "masterbatch/mb-101-mb-amarillo-huevo.pdf"
  }
]
```

También se acepta `publicUrl` si ya se quiere pegar la URL completa.

## 4. Actualizar `products.ficha_tecnica`

Script:

- `scripts/update-tech-sheet-urls.mjs`

Dry run:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/update-tech-sheet-urls.mjs --manifest data/tech-sheets-manifest.json --dry-run
```

Aplicar cambios:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/update-tech-sheet-urls.mjs --manifest data/tech-sheets-manifest.json
```

## 5. Regenerar el catálogo

Después de actualizar las URLs:

```bash
npm run build
```

## Nota

El front actual ya usa el campo `ficha_tecnica` tal cual, así que no hace falta tocar `build.js` ni `assets/js/products.js` siempre que el campo termine apuntando al PDF nuevo en Supabase.
