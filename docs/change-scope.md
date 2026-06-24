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

## carpetas permitidas

- `scripts/`
- `.husky/`

## cambios prohibidos

- `main`
- `filiales/`
- `assets/`
- `public/`
- `components/`
- `app/`
- `pages/`
- `index.html`
- `index.en.html`

## notas

- Esta fase no cambia comportamiento público del sitio.
- No se introducen nuevas fuentes de datos de filiales.
- Cualquier archivo fuera de `archivos permitidos` o `carpetas permitidas` debe hacer fallar el scope.
- Las rutas críticas solo pueden tocarse si se declaran explícitamente en este archivo.
- `validate-change-scope --audit` compara `baseline...HEAD` y audita solo cambios ya committeados en la rama actual.
- `validate-change-scope --audit` no inspecciona cambios sin commit ni cambios solo staged; para eso se usa el modo por defecto basado en `git diff --cached --name-status`.
