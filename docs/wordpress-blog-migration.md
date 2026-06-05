# WordPress blog migration

Esta guía deja preparado el paso de WordPress en VPS y la carga del blog actual de AGAMA desde Webflow.

## 1. Objetivo

- Publicar el blog en `https://<dominio>/blog`
- Mantener el blog editable desde panel WordPress
- Conservar fechas, categoría `Noticias`, slugs e imágenes principales del blog actual
- Evitar depender del placeholder estático una vez que WordPress esté online

## 2. Qué incluye ya el repo

- Tema base: [`wp.zip`](../wp.zip)
- Tema fuente: [`wordpress/wp-content/themes/agama-blog`](../wordpress/wp-content/themes/agama-blog)
- Manifest del blog real: [`wordpress/import/agama-blog-posts.json`](../wordpress/import/agama-blog-posts.json)
- Snapshot listo para importar sin depender de Webflow en vivo: [`wordpress/import/agama-blog-posts.snapshot.json`](../wordpress/import/agama-blog-posts.snapshot.json)
- Imágenes destacadas locales del blog: `wordpress/import/featured-images/`
- Importador WP-CLI: [`wordpress/import/agama-blog-import.php`](../wordpress/import/agama-blog-import.php)

## 3. Checklist del VPS

Antes de instalar WordPress, confirmar en el VPS:

- PHP 8.1+ con extensiones habituales de WordPress
- MySQL o MariaDB
- escritura en `wp-content/uploads`
- salida HTTP permitida desde el servidor
  Nota: el importador descarga HTML e imágenes del blog actual
- posibilidad de publicar WordPress en `/blog`

## 4. Instalación base de WordPress

Pasos recomendados:

1. Crear una base de datos y un usuario dedicados para WordPress.
2. Instalar WordPress en la ubicación que vaya a resolver `/blog`.
3. Completar el instalador inicial y crear el usuario admin.
4. Activar enlaces permanentes con estructura `/%postname%/`.
5. Subir y activar `wp.zip` como tema `agama-blog`.

## 5. Regenerar snapshot del blog si cambia el origen

Si antes de importar se modifica el blog de Webflow o se añaden entradas nuevas:

```bash
npm run blog:export-snapshot
```

Ese comando vuelve a descargar los artículos listados en el manifest y actualiza `wordpress/import/agama-blog-posts.snapshot.json`.
También descarga las imágenes destacadas a `wordpress/import/featured-images/`.

## 6. Importar los posts actuales

Con WordPress y WP-CLI listos en el VPS, ejecutar desde la raíz del proyecto:

```bash
wp eval-file wordpress/import/agama-blog-import.php
```

Qué hace el importador:

- crea o reutiliza la categoría `Noticias`
- usa primero el snapshot local ya guardado en `wordpress/import/agama-blog-posts.snapshot.json`
- si no existe snapshot, descarga el HTML real desde `https://www.agama.com.mx/entrada-de-blog/...`
- extrae el cuerpo del artículo sin el bloque de audio
- conserva slug, título y fecha del manifest
- usa primero la imagen destacada local guardada en `wordpress/import/featured-images/`
- si no existe la imagen local, descarga la imagen destacada desde su URL original
- actualiza enlaces internos del formato antiguo `/entrada-de-blog/...` a `/blog/<slug>/`
- reejecuta en modo idempotente sobre el mismo slug

## 7. Validación después de importar

Revisar manualmente en WordPress:

- listado del blog
- páginas single
- fecha de cada post
- categoría `Noticias`
- imagen destacada
- enlaces internos entre artículos
- responsive básico

## 8. Limitaciones conocidas

- El importador no trae el reproductor `Escucha el artículo`
- El newsletter del blog sigue siendo una captura a Supabase en el placeholder estático hasta que el tráfico apunte al WordPress real
- La instalación efectiva en el VPS requiere acceso SSH/panel del servidor y no puede completarse solo desde este repo
- Si se pierde el snapshot o la carpeta `featured-images`, el importador volverá a depender de salida HTTP para HTML o imágenes
