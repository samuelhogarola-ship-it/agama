# CLAUDE.md — Reglas para este proyecto

## Gobernanza del repo

- `CHANGELOG.md` es el changelog oficial del proyecto.
- `docs/change-scope.md` es la fuente canónica del alcance permitido del cambio actual.
- Ningún cambio fuera de `docs/change-scope.md` está permitido.
- No se trabaja directamente en `main`.
- No se permite trabajar, commitear ni pushear desde `detached HEAD`.
- Solo puede existir una rama/worktree activa aparte de `main`; las demás deben quedar aparcadas en `docs/worktree-control.json`.
- `docs/filiales-data-discrepancy-report.md` es solo auditoría histórica, no fuente canónica.

## Datos críticos de filiales

- Cualquier edición en `filiales/*/index.html` exige actualizar:
  - `docs/filiales-data-lock-plan.md`
  - `CHANGELOG.md`
  - la contraparte `filiales/*/index.en.html`
- No editar datos críticos de filiales fuera del flujo validado por los guardrails del repo.

## Protección explícita: tarjetas de producto en homepage

**No modificar** el bloque `.products-grid` en `index.html` (sección "Da un vistazo a los catálogos…") sin autorización explícita del propietario.

Esto incluye:
- La estructura del elemento `<img>` (no convertir a `<picture>`, no añadir WebP sources, no añadir `sizes`, `width`, `height`, `decoding`)
- Los archivos `srcset` referenciados (`.jpg` únicamente, variantes `p-500` y full)
- El orden y cantidad de tarjetas

**Razón:** la estructura debe ser idéntica a `index.en.html`. Cualquier divergencia introduce inconsistencias visuales entre ES y EN que requieren revisión manual del propietario.

**Referencia:** ver comentario inline en `index.html` antes de `.products-grid`.
