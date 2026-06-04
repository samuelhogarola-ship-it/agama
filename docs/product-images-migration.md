# Product Images Migration

Migración de imágenes de producto desde URLs heredadas de Webflow a Supabase Storage.

## Objetivo

- Mover `public.products.portada` y `public.products.galeria` al bucket público `product-images`.
- Eliminar dependencia del catálogo respecto a `cdn.prod.website-files.com`.
- Convertir las imágenes migradas a `.webp` con `cwebp`.
- Mantener lectura pública del bucket, pero restringir insert/update/delete a rutas administrativas con `service_role`.

## Archivos involucrados

- `supabase/migrations/20260601010000_product_images_storage.sql`
- `scripts/export-product-images-manifest.mjs`
- `scripts/migrate-product-images-all.mjs`
- `scripts/migrate-product-images-to-webp.mjs`
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

3. Descargar las imágenes desde `sourceUrl`, convertirlas a WebP con `cwebp` y subirlas a `product-images/...`:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run product-images:migrate-webp -- --manifest data/product-images-manifest.json
```

4. Validar el manifest final si algún producto debe saltarse (`skip: true`). El script reescribe `bucketPath` a `.webp` y añade `publicUrl`.

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

## Ejecución completa segura

El flujo completo se puede ejecutar con un único comando. El script valida `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, disponibilidad de `cwebp` y existencia del manifest; después corre un dry-run sobre un manifest temporal y pide escribir `MIGRATE` antes de hacer la subida real.

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run product-images:migrate-all
```

Con confirmación automática:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run product-images:migrate-all -- --yes
```

El script nunca imprime `SUPABASE_SERVICE_ROLE_KEY`.

## Convención de rutas

- Portada: `tipo_producto/slug/cover.webp`
- Galería: `tipo_producto/slug/gallery-1.webp`, `gallery-2.webp`, etc.

Ejemplo:

- `masterbatch/mb-101-mb-amarillo-huevo/cover.webp`
- `masterbatch/mb-101-mb-amarillo-huevo/gallery-1.webp`

## Notas

- `sourceUrl` es solo referencia operativa para bajar archivos heredados; no se usa en runtime.
- `galeria` sigue guardándose en `public.products` como lista separada por comas, pero con URLs nuevas de Supabase.
