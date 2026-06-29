# Change Scope

## baseline

- `stable-web-2026-06-24`

## archivos permitidos

- `docs/worktree-control.json`
- `docs/change-scope.md`
- `CHANGELOG.md`
- `blog/index.html`
- `entrada-de-blog/el-precio-es-una-respuesta-no-una-explicacion/index.html`
- `entrada-de-blog/en-que-momento-dejamos-de-ser-estudiantes/index.html`

## carpetas permitidas

- `scripts/`

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
- `blog-agama/index.html`

## notas

- Este alcance solo permite trabajo en el bloque de publicaciones del blog indicado en `NEXT.md`.
- El primer post queda publicado en `blog/index.html` y el segundo queda preparado sin enlazarse públicamente.
- No existe soporte real de programación en el blog estático actual; la publicación programada se simula manteniendo el segundo post sin enlace público y con `noindex` temporal.
- Para publicar `entrada-de-blog/en-que-momento-dejamos-de-ser-estudiantes/` en la fecha prevista hay que cambiar su `meta name="robots"` a `index,follow` y añadirlo manualmente a `blog/index.html`.
- No se toca `blog-agama/index.html` hasta que haya una decisión editorial explícita sobre si ese índice legacy debe duplicar publicaciones del blog principal.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
