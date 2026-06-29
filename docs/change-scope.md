# Change Scope

## baseline

- `stable-web-2026-06-24`

## archivos permitidos

- `docs/worktree-control.json`
- `docs/change-scope.md`
- `CHANGELOG.md`
- `blog-agama/index.html`

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
- `blog/index.html`
- `entrada-de-blog/`

## notas

- Este alcance solo permite un microfix en `blog-agama/index.html`.
- Se añade la preview del primer post ya publicado en `/blog/` para reflejarlo también en el índice legacy.
- No se toca el segundo post `en-que-momento-dejamos-de-ser-estudiantes`, no se enlaza y no se modifican sus metadatos.
- No se toca `blog/index.html`, el hero, las entradas individuales del blog, filiales ni entregas.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
