# Blog redirects — Webflow antiguo a WordPress `/blog`

Este documento deja preparado el mapeo de redirecciones 301 para pasar del blog antiguo de Webflow al nuevo blog en WordPress dentro de `/blog`.

## Objetivo

- conservar tráfico y SEO del blog actual
- evitar 404 al apagar `blog-agama` y `/entrada-de-blog/...`
- mantener la URL final del nuevo blog en `/blog/...`

## Redirecciones principales

| Origen | Destino |
|---|---|
| `/blog-agama` | `/blog/` |
| `/blog-agama/` | `/blog/` |
| `/entrada-de-blog/mb-115-negro-kalo-mejora-su-dispersion` | `/blog/mb-115-negro-kalo-mejora-su-dispersion/` |
| `/entrada-de-blog/por-que-varia-el-color-en-materiales-lechosos-o-con-base-blanca` | `/blog/por-que-varia-el-color-en-materiales-lechosos-o-con-base-blanca/` |
| `/entrada-de-blog/que-es-un-pigmento-y-que-es-un-masterbatch` | `/blog/que-es-un-pigmento-y-que-es-un-masterbatch/` |
| `/entrada-de-blog/006-por-que-hay-colores-que-se-salen-del-plastico` | `/blog/006-por-que-hay-colores-que-se-salen-del-plastico/` |
| `/entrada-de-blog/005-que-es-realmente-el-plastico` | `/blog/005-que-es-realmente-el-plastico/` |
| `/entrada-de-blog/004-como-formulamos-los-masterbatch-de-linea` | `/blog/004-como-formulamos-los-masterbatch-de-linea/` |
| `/entrada-de-blog/003-que-es-un-vehiculo` | `/blog/003-que-es-un-vehiculo/` |
| `/entrada-de-blog/002-claves-de-productos` | `/blog/002-claves-de-productos/` |
| `/entrada-de-blog/001-que-significa-la-palabra-agama` | `/blog/001-que-significa-la-palabra-agama/` |

## Regla de fallback recomendada

Si en el corte final quedan URLs antiguas de blog no listadas aquí, conviene redirigir el índice antiguo completo al nuevo blog:

- `/blog-agama` → `/blog/`

Para `/entrada-de-blog/...` solo conviene usar fallback si el slug nuevo coincide exactamente con el antiguo. En esta migración sí coincide, así que un fallback de patrón también es válido:

- `/entrada-de-blog/<slug>` → `/blog/<slug>/`

## Orden recomendado al aplicar

1. Aplicar primero las redirecciones explícitas de las 9 entradas.
2. Aplicar después el fallback del índice `/blog-agama`.
3. Aplicar por último el patrón genérico `/entrada-de-blog/<slug>` → `/blog/<slug>/`.

## Validación manual

Después del cambio, comprobar al menos:

- `/blog-agama`
- una entrada antigua con slug numérico, por ejemplo `/entrada-de-blog/004-como-formulamos-los-masterbatch-de-linea`
- una entrada antigua sin numeración, por ejemplo `/entrada-de-blog/mb-115-negro-kalo-mejora-su-dispersion`
- que la respuesta sea `301`
- que el destino final cargue en `/blog/...`
