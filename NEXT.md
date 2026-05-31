# NEXT

## WordPress

- [ ] Instalar WordPress en el entorno destino.
- [ ] Subir e activar [wp.zip](/Users/sam/.codex/worktrees/85cb/AGAMA/wp.zip) como tema base del blog.
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
- [ ] Resolver 5 fichas faltantes sin PDF origen:
  `ad-304-protector-uv`, `ad-313-perla-natural`, `ad-314-base-macro-batch`, `ad-315-phenil-o`, `ad-316-w-slip`

## Verificación

- [ ] Smoke de catálogo tras migrar fichas.
- [ ] Revisión manual de 5-10 productos distribuidos entre pigmentos, masterbatch y aditivos.
