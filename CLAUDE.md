# CLAUDE.md — Reglas para este proyecto

## Protección explícita: tarjetas de producto en homepage

**No modificar** el bloque `.products-grid` en `index.html` (sección "Da un vistazo a los catálogos…") sin autorización explícita del propietario.

Esto incluye:
- La estructura del elemento `<img>` (no convertir a `<picture>`, no añadir WebP sources, no añadir `sizes`, `width`, `height`, `decoding`)
- Los archivos `srcset` referenciados (`.jpg` únicamente, variantes `p-500` y full)
- El orden y cantidad de tarjetas

**Razón:** la estructura debe ser idéntica a `index.en.html`. Cualquier divergencia introduce inconsistencias visuales entre ES y EN que requieren revisión manual del propietario.

**Referencia:** ver comentario inline en `index.html` antes de `.products-grid`.
