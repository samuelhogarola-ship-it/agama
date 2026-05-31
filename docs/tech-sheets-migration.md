# Fichas Técnicas → Supabase Storage

Guía breve para dejar de depender del CDN de Webflow en `products.ficha_tecnica`.

## 1. Aplicar la migración de Storage

Migración:

- [supabase/migrations/20260531210000_product_tech_sheets_storage.sql](/Users/sam/.codex/worktrees/85cb/AGAMA/supabase/migrations/20260531210000_product_tech_sheets_storage.sql:1)

Esto crea el bucket público `product-tech-sheets` y las policies necesarias.

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

Eso genera [data/tech-sheets-manifest.json](/Users/sam/.codex/worktrees/85cb/AGAMA/data/tech-sheets-manifest.json:1) con:

- `sourceUrl` cuando el catálogo actual ya tiene un PDF en Webflow
- `skip: true` cuando hoy no existe PDF origen y conviene no actualizar esa ficha todavía

Plantilla manual:

- [data/tech-sheets-manifest.example.json](/Users/sam/.codex/worktrees/85cb/AGAMA/data/tech-sheets-manifest.example.json:1)

Formato por producto:

```json
[
  {
    "slug": "mb101-amarillo-huevo",
    "bucketPath": "masterbatch/mb101-amarillo-huevo.pdf"
  }
]
```

También se acepta `publicUrl` si ya se quiere pegar la URL completa.

## 4. Actualizar `products.ficha_tecnica`

Script:

- [scripts/update-tech-sheet-urls.mjs](/Users/sam/.codex/worktrees/85cb/AGAMA/scripts/update-tech-sheet-urls.mjs:1)

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

El front actual ya usa el campo `ficha_tecnica` tal cual, así que no hace falta tocar [build.js](/Users/sam/.codex/worktrees/85cb/AGAMA/build.js:279) ni [assets/js/products.js](/Users/sam/.codex/worktrees/85cb/AGAMA/assets/js/products.js:42) siempre que el campo termine apuntando al PDF nuevo en Supabase.
