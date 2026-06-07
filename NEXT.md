# NEXT — Cierre de migración AGAMA

## Current Focus

Dejar la web lista para el corte real de DNS y redirecciones con criterio de `go-live seguro`.

## Hecho

- `/blog/` ya es una sección estática autocontenida dentro del repo.
- `blog-agama/` se conserva como ruta histórica activa.
- Las entradas históricas en `/entrada-de-blog/<slug>/` ya no dependen operativamente de Webflow.
- El newsletter del blog queda integrado con el flujo actual del sitio.
- Se añadió `/faqs/` para eliminar CTAs rotos desde filiales.
- Se normalizaron enlaces internos legacy principales:
  - `ubicaciones-agama` → `/filiales/`
  - `tipo-de-producto/*` → `/productos/*/`
  - `contacto-agama` → `/contacto/`
  - `entregas-a-domicilio` → `/entregas/`
  - navegación principal al blog → `/blog/`
- Smoke tests locales en verde.
- `precommit:check` en verde.

## Bloqueantes reales antes del corte

### 1. Despliegue remoto desincronizado

La URL pública de preproducción no refleja todavía el estado actual de `main` ni del repo local.

Hay que confirmar y forzar despliegue actualizado hasta que remoto muestre:

- newsletter activo en home
- newsletter activo en blog
- contacto actual
- vacantes actual
- catálogo con imágenes y PDFs desde Supabase

### 2. Verificación remota final

Una vez actualizado el deploy, ejecutar y validar:

- home
- `/blog/`
- dos entradas en `/entrada-de-blog/...`
- `/contacto/`
- `/vacantes/jefe-de-reclutamiento-y-seleccion/`
- `/productos/pigmentos/`
- `/productos/masterbatch/`
- `/productos/aditivos/`
- `/filiales/`
- `/filiales/toluca/`

### 3. Formularios en entorno publicado

Confirmar en remoto:

- contacto → guarda en Supabase y notifica a `ceo@agamaeu.com`
- newsletter home → guarda y confirma
- newsletter blog → guarda y confirma
- vacantes → inserta en `job_applications`, admite `cv_url` y dispara `notify-contact`

## No bloqueante para go-live

- Las 5 fichas sin PDF origen siguen pendientes del dueño:
  - `ad-304-protector-uv`
  - `ad-313-perla-natural`
  - `ad-314-base-macro-batch`
  - `ad-315-phenil-o`
  - `ad-316-w-slip`

Condición:

- no deben mostrar enlace roto
- pueden quedarse sin botón o con estado neutro controlado

## Después del corte estable

- Cambiar destinatario provisional de formularios de `ceo@agamaeu.com` al correo principal del cliente.
- Revisar remitente definitivo y dominio de email.
- Preparar matriz final de redirecciones externas desde dominio/rutas antiguas.
- Retomar WordPress solo si el cliente quiere gestión editorial desde panel.

## Infra secundaria

Pendiente pero no crítico para publicar la web:

- Cloudflare
- Coolify detrás de dominio
- endurecimiento SSH con clave pública
- backups externos con retención histórica
