# AGAMA Blog Theme

Tema base para migrar el blog de AGAMA desde Webflow a WordPress.

## Qué incluye

- Portada de blog (`home.php`)
- Archivo de categorías/fechas (`archive.php`)
- Plantilla de artículo (`single.php`)
- Sidebar editorial con categorías y entradas recientes
- Enlaces y estética alineados con el sitio actual

## Assets incluidos

El tema incluye dentro de su propia carpeta los recursos visuales necesarios para funcionar en un WordPress limpio:

- `assets/css/normalize.css`
- `assets/css/webflow.css`
- `assets/css/webflow-base.css`
- `assets/css/home-custom.css`
- `assets/fonts/*`
- `assets/img/agama.svg`
- `assets/img/*` que son referenciados por el CSS compartido

Todas las referencias del tema cargan estos archivos con `get_template_directory_uri()`, sin depender de `/assets` en el dominio raíz.

## Siguientes pasos

1. Instalar el tema en WordPress.
2. Crear categorías editoriales.
3. Importar posts migrados desde Webflow.
4. Revisar menús permanentes, breadcrumbs y SEO plugin.
5. Revisar menús permanentes, breadcrumbs y SEO plugin según el entorno final.
