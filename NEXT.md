# NEXT — Cierre de migración AGAMA

## Current Focus

Cerrar el seguimiento de la PR de filiales y dejar operativo el entorno local base para la próxima sesión:

- instalar y validar `eslint` en `portal/`
- dejar `pre-commit` funcionando de punta a punta en un entorno nuevo
- después, retomar la verificación del deploy público antes del corte real de DNS

## Hecho

- `/blog/` ya es una sección estática autocontenida dentro del repo.
- `blog-agama/` se conserva como ruta histórica activa.
- Las entradas históricas en `/entrada-de-blog/<slug>/` ya no dependen operativamente de Webflow.
- El newsletter del blog queda integrado con el flujo actual del sitio.
- Se añadió `/faqs/` para eliminar CTAs rotos desde filiales.
- El footer global ya enlaza a `/faqs/`.
- `/faqs/` ya entra en `dist/`, usa el mismo header/footer del sitio y contiene FAQs comerciales/técnicas reales.
- Se restauraron los datos fiscales y bancarios históricos en todas las páginas de `filiales/` en ES/EN.
- Se corrigió el mosaico visual de filiales para que las imágenes cubran bien y el texto sea legible.
- Se normalizaron enlaces internos legacy principales:
  - `ubicaciones-agama` → `/filiales/`
  - `tipo-de-producto/*` → `/productos/*/`
  - `contacto-agama` → `/contacto/`
  - `entregas-a-domicilio` → `/entregas/`
  - navegación principal al blog → `/blog/`
- Smoke tests locales en verde.
- La rama `codex/restore-branch-fiscal-data` y la PR `#35` ya están publicadas.

## Pendiente inmediato de entorno

- El `precommit:check` falló en este entorno porque `portal` no encuentra `eslint`.
- Antes de la siguiente tanda de cambios hay que instalar/validar las dependencias mínimas de lint y asegurar que el hook de pre-commit funciona en limpio.

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
- `/faqs/`
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

## Pendiente eventos

- En `/eventos/`, el switch de idioma **EN** desaparece al hacer scroll hacia abajo. Hay que anclarlo al nav fijo para que permanezca visible durante todo el scroll.

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

## Pendiente email / DNS

- **`www.agama.com.mx`**: pedir a Cayman que apunte a `2.24.10.239` y añadir `https://www.agama.com.mx` en Domains de Coolify (actualmente sigue en Webflow).
- **Newsletter Resend**: verificar dominio `agama.com.mx` en resend.com/domains para poder enviar confirmaciones a suscriptores externos. Hasta entonces solo funciona en testing mode (envía a `ceo@agamaeu.com`).
