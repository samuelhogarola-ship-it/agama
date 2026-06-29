# Change Scope

## baseline

- `stable-web-2026-06-24`

## archivos permitidos

- `docs/worktree-control.json`
- `docs/change-scope.md`
- `CHANGELOG.md`
- `NEXT.md`
- `scripts/generate-static-blog.mjs`
- `sitemap.xml`
- `blog/index.html`
- `blog/index.en.html`

## carpetas permitidas


## cambios prohibidos

- `main`
- `assets/`
- `public/`
- `components/`
- `app/`
- `pages/`
- `index.html`
- `index.en.html`
- `filiales/`
- `entregas/`
- `entrada-de-blog/`
- `blog-agama/index.html`
- `wordpress/`
- `wp.zip`
- `agama-web.webflow/`

## notas

- Este alcance solo permite un microfix defensivo del blog: protección del generador, sitemap del primer post publicado, documentación de estado y retirada del copy residual de archivo.
- `scripts/generate-static-blog.mjs` debe preservar los posts manuales que no existen en el snapshot histórico.
- `sitemap.xml` solo puede añadir `el-precio-es-una-respuesta-no-una-explicacion`; no se añade el segundo post programado.
- No se toca el segundo post `en-que-momento-dejamos-de-ser-estudiantes`, no se enlaza y no se modifican sus metadatos `noindex,nofollow,noarchive`.
- No se toca el hero, las entradas individuales del blog, filiales, entregas, Webflow legacy ni `wp.zip`.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
