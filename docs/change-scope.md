# Change Scope

## baseline

- `stable-web-2026-06-24`

## archivos permitidos

- `docs/filiales-data-lock-plan.md`
- `docs/filiales-data-discrepancy-report.md`
- `docs/worktree-control.json`
- `docs/change-scope.md`
- `CHANGELOG.md`
- `MEJORAS.md`
- `CLAUDE.md`
- `package.json`
- `.husky/pre-commit`
- `.husky/pre-push`
- `filiales/chalco/index.html`
- `filiales/chalco/index.en.html`
- `filiales/cuautitlan/index.html`
- `filiales/cuautitlan/index.en.html`
- `filiales/ecatepec/index.html`
- `filiales/ecatepec/index.en.html`
- `filiales/ermita/index.html`
- `filiales/ermita/index.en.html`
- `filiales/guadalajara/index.html`
- `filiales/guadalajara/index.en.html`
- `filiales/leon/index.html`
- `filiales/leon/index.en.html`
- `filiales/merced/index.html`
- `filiales/merced/index.en.html`
- `filiales/monterrey/index.html`
- `filiales/monterrey/index.en.html`
- `filiales/online/index.html`
- `filiales/pantitlan/index.html`
- `filiales/pantitlan/index.en.html`
- `filiales/puebla/index.html`
- `filiales/puebla/index.en.html`
- `filiales/queretaro/index.html`
- `filiales/queretaro/index.en.html`
- `filiales/san-luis-potosi/index.html`
- `filiales/san-luis-potosi/index.en.html`
- `filiales/texcoco/index.html`
- `filiales/texcoco/index.en.html`
- `filiales/tlahuac/index.html`
- `filiales/tlahuac/index.en.html`
- `filiales/toluca/index.html`
- `filiales/toluca/index.en.html`
- `filiales/zaragoza/index.html`
- `filiales/zaragoza/index.en.html`

## carpetas permitidas

- `scripts/`
- `.husky/`

## cambios prohibidos

- `main`
- `assets/`
- `public/`
- `components/`
- `app/`
- `pages/`
- `index.html`
- `index.en.html`
- `filiales/index.html`
- `filiales/index.en.html`
- `filiales/*/index.en.html`

## notas

- La Fase 1 conserva su baseline, permisos y guardrails actuales.
- Este alcance añade una excepción explícita para SEO local en `filiales/<slug>/index.html`.
- En esas fichas solo se permite modificar `<title>` y `<meta name="description" content="...">`.
- No se modifica contenido visible, teléfonos, direcciones ni datos fiscales o bancarios.
- `filiales/online/index.html` se trata como excepción comercial no local, con copy orientado a cobertura en México y sin anclarlo a Zaragoza.
- No se toca `index.en.html` porque no existe un guardrail de paridad automatizado que obligue a replicar este cambio SEO en inglés.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
