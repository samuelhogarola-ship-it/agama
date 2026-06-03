# Product Images Migration

Migración de imágenes de producto desde URLs heredadas de Webflow a Supabase Storage.

## Objetivo

- Mover `public.products.portada` y `public.products.galeria` al bucket público `product-images`.
- Eliminar dependencia del catálogo respecto a `cdn.prod.website-files.com`.

## Archivos involucrados

- `supabase/migrations/20260601010000_product_images_storage.sql`
- `scripts/export-product-images-manifest.mjs`
- `scripts/update-product-image-urls.mjs`
- `data/product-images-manifest.example.json`

## Flujo

1. Aplicar la migración del bucket:

```bash
supabase db push
```

2. Exportar el manifest inicial desde Supabase:

```bash
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
npm run product-images:export
```

3. Descargar las imágenes desde `sourceUrl` y subirlas a `product-images/...` respetando `bucketPath`.

4. Validar el manifest final si algún producto debe saltarse (`skip: true`).

5. Actualizar la base de datos:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run product-images:update -- --manifest data/product-images-manifest.json
```

6. Regenerar el catálogo:

```bash
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
npm run build
```

## Convención de rutas

- Portada: `tipo_producto/slug/cover.ext`
- Galería: `tipo_producto/slug/gallery-1.ext`, `gallery-2.ext`, etc.

Ejemplo:

- `masterbatch/mb-101-amarillo-huevo/cover.jpg`
- `masterbatch/mb-101-amarillo-huevo/gallery-1.jpg`

## Notas

- `sourceUrl` es solo referencia operativa para bajar archivos heredados; no se usa en runtime.
- `galeria` sigue guardándose en `public.products` como lista separada por comas, pero con URLs nuevas de Supabase.
