# Plan Técnico: Blindaje De Datos De Filiales

## Objetivo

Evitar que las direcciones, teléfonos, WhatsApp, emails, mapas, metadata SEO, JSON-LD y demás datos críticos de filiales vuelvan a modificarse accidentalmente por ediciones manuales dispersas.

Este documento funciona en Fase 1 como **baseline operativo auditado** contra el HTML ES actual de `filiales/*/index.html`. No sustituye la validación humana final y no introduce todavía una fuente única de datos.

## Diagnóstico

El proyecto actual sigue mezclando dos modelos:

- El catálogo de productos usa un flujo parcialmente centralizado en `build.js`.
- Las páginas de `filiales/` siguen siendo HTML estático copiado tal cual al build final.

Eso implica que los datos críticos de cada filial viven hardcodeados en varios puntos del mismo HTML y pueden desalinearse si se editan sin guardrails.

### Hallazgos principales

- Cada filial tiene al menos dos páginas manuales:
  - `filiales/<slug>/index.html`
  - `filiales/<slug>/index.en.html`
- Existe además un hub manual:
  - `filiales/index.html`
  - `filiales/index.en.html`
- `build.js` no genera páginas de filiales; solo las copia a `dist/`.
- Los datos de contacto aparecen repetidos dentro de una misma ficha:
  - CTAs de WhatsApp
  - bloque de contacto
  - Google Maps
  - metadata
  - variantes ES/EN

## Baseline Operativo Actual

### Contacto y dirección (baseline actualizado — 2026-07-18)

| Filial | Teléfono operativo | WhatsApp operativo | Dirección operativa |
|---|---|---|---|
| Monterrey | +52 81 4105 6270 | +52 81 3565 2996 | Calle Joaquín G. Leal Nte. 988-Local O, Centro, 64000, Monterrey, N.L. |
| Puebla | +52 222 418 0483 | +52 222 115 6212 | Blvd. Carmen Serdán No.56, Santa María la Rivera, 72010, Puebla, Pue. |
| Querétaro | +52 442 189 4658 | +52 442 712 4793 | Autopista México-Querétaro 2001-Local 106, Villas del Sol, 76046, Santiago de Querétaro, Qro. |
| San Luis Potosí | +52 444 773 4771 | +52 444 671 1198 | Av. Universidad 2045-4, San Luis, 78310, San Luis Potosí, S.L.P. |
| Chalco | +52 55 3092 0925 | +52 55 3462 5062 | Carretera México-Cuautla Km.1, Col. Casco de San Juan, 56600, Chalco, Estado de México, Méx. |
| Cuautitlán | +52 55 5870 4027 | +52 55 2717 8522 | Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México |
| Ecatepec | +52 55 5714 7170 | +52 55 3930 7930 | Avenida Emiliano Zapata No.3, Col. Urbana Ixhuatepec, 55349, Ecatepec de Morelos, Méx., México |
| Ermita | +52 55 2608 8600 | +52 55 3078 5677 | Calz. Ermita Iztapalapa 1697, Col. Santa María Aztahuacan, 09500, Iztapalapa, CDMX |
| León | +52 477 718 9302 | +52 477 590 4632 | Blvd. Hermanos Aldama 2501, Col. Industrial La Pompa, 37490 León, Gto. |
| Merced | pendiente (HTML ES actual sin teléfono visible) | +52 55 3265 0482 | Fray Servando Teresa de Mier 507, Merced Balbuena, 15810 Ciudad de México, CDMX |
| Guadalajara | +52 33 4387 0267 | +52 33 1708 1984 | Calzada Lázaro Cárdenas No.2380 Local 23, Col. Del Fresno, 44909 Guadalajara, Jal. |
| Zaragoza | +52 55 5571 2933 | +52 55 8560 6035 | Calz. Ignacio Zaragoza No.547, Col. Ignacio Zaragoza, 15000 CDMX |
| Tláhuac | +52 55 5850 9148 | +52 55 2150 7144 | Avenida Tláhuac No.4803, Col. San Lorenzo, 00900 Iztapalapa, CDMX |
| Texcoco | +52 55 8991 8216 | +52 55 3500 5560 | Avenida Texcoco No.170, Mexico 1ra Sección, 57620 Nezahualcóyotl, Méx. |
| Pantitlán | +52 55 2232 7179 | +52 55 1378 9892 | Avenida Pantitlán No.337-289, Col. Evolución, 57700 Nezahualcóyotl, Méx. |
| Online | +52 55 5762 5515 | +52 55 7351 5156 | Cobertura digital para atención y seguimiento comercial en todo México. |
| Toluca | +52 722 946 8099 | +52 1 55 2310 3494 | Av. Lerma 320-MZ 019, San Mateo Atenco, Méx. |

### Datos fiscales y bancarios (HTML ES auditado — 2026-06-24)

| Filial | Razón social | RFC | Banco | Sucursal | Cuenta | CLABE |
|---|---|---|---|---|---|---|
| Monterrey | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | 7004 | 2749-484 | 002-180-700-427-494-844 |
| Puebla | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | 7004 | 2749-484 | 002-180-700-427-494-844 |
| Querétaro | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | 7004 | 2749-484 | 002-180-700-427-494-844 |
| San Luis Potosí | PALMA AGAMA ADRIAN | PAAA-870205-SV0 | Banamex | 7019 | 1655-794 | 002-180-701-916-557-945 |
| Chalco | MIRIAM ANGELICA CERVANTES DEL RAZO | CERM-800626-EV0 | Banamex | 7014 | 5967692 | 002-180-701-459-676-927 |
| Cuautitlán | PALMA AGAMA ADRIAN | PAAA-870205-SV0 | Banamex | 7019 | 1655-794 | 002-180-701-916-557-945 |
| Ecatepec | CISNEROS DOMINGUEZ ADRIANA | CIDA-840206-1S9 | Banamex | 7017 | 3149-563 | 002-849-701-731-495-633 |
| Ermita | ALARCON AGAMA OMAR DE JESUS | AAAO-850307-2G8 | Banamex | 7001 | 3469-983 | 002-849-701-734-699-834 |
| León | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | 7004 | 2749-484 | 002-180-700-427-494-844 |
| Merced | ADRIAN PALMA AGAMA | PAAA-870205-SV0 | Banamex | 7019 | 1655-794 | 002-180-701-916-557-945 |
| Guadalajara | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | 7004 | 2749-484 | 002-180-700-427-494-844 |
| Zaragoza | POLY BEBUS SAS | PBE-210607-L46 | Banamex | 7012 | 8835-103 | 002-180-701-288-351-031 |
| Tláhuac | MIRIAM ANGELICA CERVANTES DEL RAZO | CERM-800626-EV0 | Banamex | 7014 | 5967692 | 002-180-701-459-676-927 |
| Texcoco | PINEDA CARRERA JUAN | PICJ-540126-S41 | Banamex | 7005 | 3486-876 | 002-180-700-534-868-761 |
| Pantitlán | PINEDA CARRERA JUAN | PICJ-540126-S41 | Banamex | 7005 | 3486-876 | 002-180-700-534-868-761 |
| Online | U547 SAS | UXX-240617-7X7 | Banamex | 7019 | 3706-108 | 002-180-701-937-061-083 |
| Toluca | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | ausente (no visible en HTML ES actual) | ausente (no visible en HTML ES actual) | ausente (no visible en HTML ES actual) |

## Pendientes humanos

- `Merced` mantiene el teléfono como pendiente porque el HTML ES actual no lo muestra.
- `Toluca` mantiene `Sucursal`, `Cuenta` y `CLABE` como ausentes porque no aparecen en el HTML ES actual.
- Cualquier confirmación humana posterior debe actualizar este baseline y `CHANGELOG.md` en el mismo cambio.

## Confirmaciones humanas incorporadas

- `Ecatepec`: dirección confirmada como `Avenida Emiliano Zapata No.3, Col. Urbana Ixhuatepec, 55349, Ecatepec de Morelos, Méx., México`.
- `Cuautitlán`: dirección confirmada como `Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México`.
- `Toluca`: WhatsApp confirmado como `+52 1 55 2310 3494` y teléfono fijo confirmado como `+52 722 946 8099`; son canales distintos.

## Archivos relacionados

- `filiales/index.html` / `filiales/index.en.html`
- `filiales/<slug>/index.html` / `filiales/<slug>/index.en.html`
- `assets/js/global-ui.js`
- `build.js`
- `docs/filiales-data-discrepancy-report.md`

## Reglas operativas de Fase 1

1. Este documento describe el baseline operativo actual servido por el HTML ES, no una verdad humana definitiva.
2. No introducir normalizaciones semánticas ni ortográficas por intuición.
3. Si un dato no puede extraerse de forma fiable del HTML actual, debe quedar como `pendiente` o `ausente`.
4. Mientras no exista una fuente única de datos, cualquier cambio en teléfono, WhatsApp o dirección dentro de `filiales/` exige actualizar todas sus apariciones y:
   - `docs/filiales-data-lock-plan.md`
   - `CHANGELOG.md`
   - la contraparte `index.en.html`
5. `docs/filiales-data-discrepancy-report.md` se conserva como auditoría histórica, no como fuente canónica.
6. Teléfono fijo y WhatsApp son campos independientes; no se debe sustituir uno por otro aunque ambos sean números móviles.

## Estado JSON-LD (2026-07-04)

Schema.org `LocalBusiness` (o `OnlineStore` para la filial digital) añadido a las 16 filiales que carecían de él. Datos utilizados: los del baseline operativo auditado en la tabla anterior. Coordenadas geo aproximadas por ciudad/colonia. Horario estándar (`L-V 08:30–17:30, Sáb 08:30–14:00`) aplicado a todas las físicas.

| Filial | ES JSON-LD | EN JSON-LD |
|---|---|---|
| Chalco | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Cuautitlán | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Ecatepec | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Ermita | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Guadalajara | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| León | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Merced | ✅ añadido 2026-07-04 (sin teléfono — dato pendiente) | ✅ añadido 2026-07-04 |
| Monterrey | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Online | ✅ añadido 2026-07-04 (`OnlineStore`) | ✅ añadido 2026-07-04 |
| Pantitlán | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Puebla | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Querétaro | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| San Luis Potosí | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Texcoco | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Tláhuac | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Zaragoza | ✅ añadido 2026-07-04 | ✅ añadido 2026-07-04 |
| Toluca | ✅ ya existía | ✅ ya existía |

## Siguiente fase

- Introducir una fuente única de datos para filiales.
- Derivar desde ahí HTML, metadata y validaciones.
- Validar coordenadas geo con Google Maps / GBP para cada filial.
- Añadir teléfono a Merced cuando esté disponible.
- Mantener los guardrails actuales como red de seguridad durante la migración.

## Estado visual de fichas físicas (2026-07-17)

- Las 15 fichas físicas anteriores a Toluca replican en ES y EN el patrón inicial de `Información de sucursal` usado por Toluca.
- El bloque resume horarios, WhatsApp, sitio web, teléfono cuando existe, dirección, mapa, razón social, RFC y banco.
- Los valores se copiaron desde el HTML ES ya publicado de cada filial. Esta intervención no cambia el baseline operativo de las tablas anteriores ni lo presenta como una fuente humana definitiva.
- Las secciones completas de contacto y datos fiscales/bancarios se conservan sin modificaciones, incluidos sucursal, cuenta y CLABE cuando ya estaban visibles.
- Merced sigue sin teléfono fijo visible y no recibe ningún valor inferido.
- AGAMA Online conserva una arquitectura independiente, no adopta el patrón de sucursal física y queda orientada a evolucionar hacia una tienda comercial real.
- Los títulos, metadescripciones, canonical, hreflang, contenido SEO local y JSON-LD existentes quedan fuera de esta modificación visual.
