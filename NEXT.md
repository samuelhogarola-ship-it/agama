# NEXT

## WordPress

- [ ] Instalar WordPress en el VPS / entorno destino.
  Nota: queda pendiente por acceso al servidor; el repo ya incluye tema, manifest e importador WP-CLI para ejecutar la migración real del blog.
- [ ] Subir e activar [wp.zip](./wp.zip) como tema base del blog.
- [ ] Confirmar instalación del tema autocontenido `agama-blog` en un WordPress limpio.
- [ ] Validar visualmente el tema `agama-blog` con contenido real.
- [ ] Definir categorías, slugs y estructura editorial del blog.
- [x] Preparar importación real del blog desde Webflow con manifest e importador WordPress.
  Nota: ver `docs/wordpress-blog-migration.md` y `wordpress/import/agama-blog-import.php`.
- [ ] Ejecutar importación real del blog desde Webflow en el WordPress del VPS.
- [ ] Revisar SEO del blog en WordPress: títulos, metadescriptions, categorías, OG y canonicals.
- [x] Preparar mapa de redirecciones del blog antiguo `blog-agama` y `/entrada-de-blog/...` hacia `/blog/...`.
  Nota: ver `docs/blog-redirects.md` y `docs/nginx-blog-redirects.conf`.

## Blog Legacy

- [x] Reconstruir el blog histórico en estático con sus URLs antiguas.
  Nota: el archivo vive en `blog-agama/` y los posts en `entrada-de-blog/<slug>/`.
- [x] Descargar y servir en local las imágenes destacadas del blog histórico.
  Nota: los assets se publican desde `blog-assets/featured-images/`.
- [x] Dejar generador reproducible del blog histórico a partir del snapshot.
  Nota: usar `npm run blog:generate-static`.
- [x] Conectar el alta del boletín del blog a `newsletter_signups` con email de confirmación al suscriptor.
- [x] Dejar visible y operativo el formulario de newsletter del blog en la web activa.
  Nota: el bloque ya está expuesto en la landing y en el blog estático actual; antes no estaba disponible en la web activa.
- [x] Preparar automatización para avisar por email cuando se publique un nuevo post estático.
  Nota: ver `docs/blog-notifications.md`, `npm run blog:publish` y la Edge Function `notify-blog-post`.
- [ ] Desplegar en Supabase real la tabla `blog_post_notifications`, la tabla `blog_post_notification_recipients` y la Edge Function `notify-blog-post`.
- [ ] Ejecutar el primer bootstrap en entorno real para marcar los posts históricos sin enviar avisos retroactivos.

## Fichas Técnicas

- [x] Crear bucket o convención definitiva en Supabase Storage para PDFs de fichas técnicas.
- [x] Subir los PDFs actuales al storage de Supabase.
- [x] Actualizar `public.products.ficha_tecnica` para que apunte a URLs de Supabase y no al CDN de Webflow.
- [x] Verificar que el catálogo estático y las fichas de producto siguen abriendo el PDF correcto.
- [x] Regenerar el catálogo con `npm run build` después de actualizar las URLs.
- [ ] Dejar apartadas como pendiente no bloqueante 5 fichas sin PDF origen confirmado:
  `ad-304-protector-uv`, `ad-313-perla-natural`, `ad-314-base-macro-batch`, `ad-315-phenil-o`, `ad-316-w-slip`
  Nota: los productos existen en la web real o en catálogo, pero no hay PDF fuente válido en el catálogo actual para migración inmediata.

## Imágenes de Producto

- [x] Preparar bucket y scripts para migrar `products.portada` y `products.galeria` a Supabase Storage.
- [x] Exportar `data/product-images-manifest.json` desde Supabase.
- [x] Subir imágenes del catálogo al bucket `product-images`.
- [x] Actualizar `public.products.portada` y `public.products.galeria` para dejar de apuntar a Webflow.
- [x] Regenerar el catálogo con `npm run build`.
- [x] Verificar que `dist/productos` ya no use `cdn.prod.website-files.com` para imágenes de producto.

## Auditoría de dependencias

- [x] Añadir chequeo automático `npm run audit:webflow` para localizar restos de Webflow en el repo.

## Infra / Emails

- [x] Mantener todos los formularios notificando a `ceo@agamaeu.com` durante la migración.
- [ ] Validar en el entorno real que `landing_contacts` y `newsletter_signups` están entrando en el Supabase correcto.
- [ ] No tocar el email principal ni el remitente definitivo hasta que la web esté funcionando completa.
- [ ] Cuando deploy + redirecciones estén cerrados, cambiar el destinatario provisional `ceo@agamaeu.com` al email principal real del cliente.
- [ ] Verificar dominio Resend `agama.com.mx` cuando se cierre la migración operativa.
- [ ] Cambiar remitente a una cuenta del dominio, por ejemplo `noreply@agama.com.mx`, solo cuando Resend esté verificado.
- [ ] Revisar trigger Supabase con `pg_net` si las notificaciones vuelven a depender del trigger SQL.

## Deploy / Go-Live

- [ ] Confirmar que el entorno de trabajo / preproducción despliega realmente desde `main`.
- [ ] Verificar visualmente que los últimos merges ya están reflejados en la web activa del entorno correcto.
- [ ] Hacer checklist final de salida antes de tocar NS:
  home, catálogo, contacto, newsletter, entregas, vacantes, blog placeholder, imágenes y PDFs válidos.
- [x] Mantener `/blog/` como placeholder transitorio con newsletter conectado a Supabase mientras WordPress no esté publicado.
- [ ] Preparar ventana de redirección de NS solo cuando deploy + formularios + checklist estén cerrados.

## Repositorio

- [x] Instalar pre-commit básico desde `core.hooksPath` con checks versionados en `.githooks/pre-commit`.
- [x] Ejecutar smoke tests reales desde el hook antes de confirmar el flujo.

## Filiales

- [x] Localizar la landing EN de Toluca para que use assets locales y no dependa del CDN de Webflow.

## Verificación

- [x] Smoke básico del catálogo tras migrar fichas e imágenes.
- [x] Revisión manual ampliada de 5-10 productos distribuidos entre pigmentos, masterbatch y aditivos.
  Nota: se revisaron `ad-301-expanso-raywan`, `ad-318-purga`, `ad-321-secante-de-humedad`, `mb-101-mb-amarillo-huevo`, `mb-151-mb-cafe-maceta`, `mb-225-mb-azul-lazo`, `bp-080-pig-azul-rey`, `bp-2248-pig-verde-pistache` y `bp-792-pig-verde-bandera`, con imágenes servidas desde Supabase y PDFs desde `product-tech-sheets`.
- [ ] Confirmar que el entorno `sslip.io` o el entorno real equivalente refleja el último estado de `main`.
