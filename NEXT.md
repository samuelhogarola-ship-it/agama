# NEXT

## WordPress

- [ ] Instalar WordPress en el entorno destino.
- [ ] Subir e activar [wp.zip](./wp.zip) como tema base del blog.
- [ ] Confirmar instalación del tema autocontenido `agama-blog` en un WordPress limpio.
- [ ] Validar visualmente el tema `agama-blog` con contenido real.
- [ ] Definir categorías, slugs y estructura editorial del blog.
- [ ] Importar contenido del blog desde Webflow.
  Nota: mejor hacerlo con HTML limpio o bloques para conservar formato, imágenes, enlaces y jerarquía; texto plano solo si luego se va a remaquetar manualmente.
- [ ] Revisar SEO del blog en WordPress: títulos, metadescriptions, categorías, OG y canonicals.

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
- [ ] Verificar dominio Resend `agama.com.mx` cuando se cierre la migración operativa.
- [ ] Cambiar remitente a una cuenta del dominio, por ejemplo `noreply@agama.com.mx`, solo cuando Resend esté verificado.
- [ ] Revisar trigger Supabase con `pg_net` si las notificaciones vuelven a depender del trigger SQL.

## Deploy / Go-Live

- [ ] Confirmar que el entorno de trabajo / preproducción despliega realmente desde `main`.
- [ ] Verificar visualmente que los últimos merges ya están reflejados en la web activa del entorno correcto.
- [ ] Hacer checklist final de salida antes de tocar NS:
  home, catálogo, contacto, newsletter, entregas, vacantes, blog placeholder, imágenes y PDFs válidos.
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
