# AGAMA Blog Theme

Tema base para migrar el blog de AGAMA desde Webflow a WordPress.

## Qué incluye

- Portada de blog (`home.php`)
- Archivo de categorías/fechas (`archive.php`)
- Plantilla de artículo (`single.php`)
- Sidebar editorial con categorías y entradas recientes
- Enlaces y estética alineados con el sitio actual

## Dependencias visuales

Este tema reutiliza los assets ya servidos por el sitio actual:

- `/assets/css/normalize.css`
- `/assets/css/webflow.css`
- `/assets/css/webflow-base.css`
- `/assets/css/home-custom.css`
- `/assets/img/agama.svg`

Por eso está pensado para instalarse en el mismo dominio donde vive la web estática actual o en una migración donde esos assets se mantengan.

## Siguientes pasos

1. Instalar el tema en WordPress.
2. Crear categorías editoriales.
3. Importar posts migrados desde Webflow.
4. Revisar menús permanentes, breadcrumbs y SEO plugin.
5. Si se quiere independencia total del sitio raíz, copiar los assets al propio tema y ajustar `functions.php`.
