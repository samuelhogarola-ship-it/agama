# AGAMA Portal

Portal PWA B2B-first para AGAMA construido con Next.js App Router.

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

Desde la raiz del repo:

```bash
npm run portal:dev
npm run portal:lint
npm run portal:build
```

## Puntos de entrada visuales

- `src/app/globals.css`
  Base visual, tokens, utilidades, layout global y clases de superficie.
- `src/app/layout.tsx`
  Metadata, fuentes locales y shell base.
- `src/components/customer-shell.tsx`
  Header, navegacion principal y estructura del portal cliente.
- `src/components/hero-section.tsx`
  Hero principal de home y lenguaje editorial.
- `src/components/catalog-explorer.tsx`
  Filtros, grid y acciones rapidas del catalogo.
- `src/components/messages-workspace.tsx`
  Layout de Mensajes y bloque contextual de Bonny.
- `src/components/ui/*`
  Primitivos reutilizables para boton, badge e input.

## Datos y assets

- `src/lib/portal-data.ts`
  Conector de productos, enriquecimiento de catalogo y fallbacks.
- `public/brand/`
  Logo oficial AGAMA e isotipo.
- `src/fonts/`
  Fuentes locales Articulat.

## Modo estable para UI

Para trabajar estilo sin depender del estado remoto:

```bash
PORTAL_PRODUCTS_SOURCE=manifest npm run dev
```

Valores disponibles:

- `auto`: intenta Supabase y cae a manifest/fallback.
- `manifest`: usa el manifest local de productos.
- `fallback`: usa solo la muestra minima de referencia.

## Testing

- Suite portal: `npm run test:portal`
- Suite publica legacy: `npm run test:public`
- CI general repo: `.github/workflows/repo-quality.yml`
