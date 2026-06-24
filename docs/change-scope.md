# Change Scope

Fecha: 2026-06-24

Objetivo:
Permitir una actualización SEO local limitada a `title` y metadescripciones únicas por filial, sin cambios en contenido visible.

Rutas permitidas:
- `CHANGELOG.md`
- `docs/change-scope.md`
- `filiales/chalco/index.html`
- `filiales/cuautitlan/index.html`
- `filiales/ecatepec/index.html`
- `filiales/ermita/index.html`
- `filiales/guadalajara/index.html`
- `filiales/leon/index.html`
- `filiales/merced/index.html`
- `filiales/monterrey/index.html`
- `filiales/online/index.html`
- `filiales/pantitlan/index.html`
- `filiales/puebla/index.html`
- `filiales/queretaro/index.html`
- `filiales/san-luis-potosi/index.html`
- `filiales/texcoco/index.html`
- `filiales/tlahuac/index.html`
- `filiales/toluca/index.html`
- `filiales/zaragoza/index.html`

Restricciones:
- Solo modificar `<title>` y `<meta name="description" content="...">`
- No modificar contenido visible
- No tocar teléfonos, direcciones ni datos fiscales o bancarios
- No tocar `index.en.html` porque no existe un guardrail de paridad automatizado en este repo que lo exija para este cambio
- `filiales/online/index.html` se trata como excepción comercial no local, con copy orientado a cobertura en México y sin anclarlo a Zaragoza
