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
| Toluca | +52 722 946 8099 | +52 722 499 7514 | Av. Lerma 320-MZ 019, Santa Maria, San Isidro, 52105 San Mateo Atenco, Méx., México |

### URLs de Google Maps confirmadas (auditadas manualmente — 2026-07-18)

| Filial | URL canónica de Maps | Estado |
|---|---|---|
| Chalco | https://www.google.com/maps/place/Agama+Chalco+-+Edomex/@19.2665754,-98.8847233,17z/data=!3m1!4b1!4m6!3m5!1s0x85ce1ecf6a1654b9:0x43a710160871ec38!8m2!3d19.2665704!4d-98.8821484!16s%2Fg%2F11b6d_4nsr?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Cuautitlán | https://www.google.com/maps/place/Agama+Cuautitlán+-+Edomex/@19.6499966,-99.1865208,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1f5fe6813a7d1:0x2db681e1b7855826!8m2!3d19.6499916!4d-99.1839459!16s%2Fg%2F11fjx8hv7k?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Ecatepec | https://www.google.com/maps/place/Agama+Ecatepec+-+Edomex/@19.5164537,-99.0924265,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fa11b3b1931d:0x29e980c1984b64a5!8m2!3d19.5164487!4d-99.0875556!16s%2Fg%2F11dxl549rx?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Ermita | https://www.google.com/maps/place/Agama+Ermita+-+CDMX/@19.3443756,-99.0325681,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fd5f5707a7df:0x4de737fdba8f1288!8m2!3d19.3443706!4d-99.0299932!16s%2Fg%2F1ptw4shbp?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Guadalajara | https://www.google.com/maps/place/Agama+-+Guadalajara/@20.6574359,-103.3815661,17z/data=!3m2!4b1!5s0x8428ade0d5060b15:0xab0634b0def2074!4m6!3m5!1s0x8428ade6d01e1c23:0xfeb7e8029662fd33!8m2!3d20.6574309!4d-103.3789912!16s%2Fg%2F11c44vfknp?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| León | https://www.google.com/maps/place/Agama+León+-+Guanajuato/@21.0864479,-101.6824451,17z/data=!3m1!4b1!4m6!3m5!1s0x842bbfe29a0af2a7:0x7fb958126e15d87b!8m2!3d21.0864429!4d-101.6798702!16s%2Fg%2F11t1r8lzjt?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Merced | https://www.google.com/maps/place/Agama+Merced+-+CDMX/@19.4221482,-99.1238588,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1feb827ef9947:0x34e735be4acc814c!8m2!3d19.4221432!4d-99.1212839!16s%2Fg%2F11cncygh9t?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Monterrey | https://www.google.com/maps/place/Agama+-+Monterrey/@25.6819698,-100.3007749,17z/data=!3m1!4b1!4m6!3m5!1s0x8662952e222d3519:0x129fb4983b1f32b4!8m2!3d25.681965!4d-100.2982!16s%2Fg%2F11txtfbscp?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Pantitlán | https://www.google.com/maps/place/Agama+Pantitlan+-+Edomex/@19.396923,-99.0239073,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fcda48ef2601:0x1a78fb5df1c7a2d1!8m2!3d19.396918!4d-99.0213324!16s%2Fg%2F11cs5y3qb1?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Puebla | https://www.google.com/maps/place/Agama+-+Puebla/@19.0793457,-98.2064719,17z/data=!3m1!4b1!4m6!3m5!1s0x85cfc1eb5a23e8e7:0x39b0a8c0403acbd5!8m2!3d19.0793406!4d-98.203897!16s%2Fg%2F11s_x31dcr?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Querétaro | https://www.google.com/maps/place/Agama+-+Querétaro/@20.5793501,-100.3797736,17z/data=!3m1!4b1!4m6!3m5!1s0x85d3450f46a90c11:0xb60d65c7537e86b!8m2!3d20.5793451!4d-100.3771987!16s%2Fg%2F11ts46gbmg?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| San Luis Potosí | https://www.google.com/maps/place/Agama+-+San+Luis+Potosí/@22.1518355,-100.9598283,17z/data=!3m2!4b1!5s0x842aa2203a8db345:0xa8488c051ee76648!4m6!3m5!1s0x842aa31bde3572a5:0x724dac2450d6e7a0!8m2!3d22.1518306!4d-100.9572534!16s%2Fg%2F11q36k6_t2?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Texcoco | https://www.google.com/maps/place/Agama+Texcoco+-+Edomex/@19.3950809,-99.0474628,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fce33e190111:0xbfd5e7a72a7f6226!8m2!3d19.3950759!4d-99.0448879!16s%2Fg%2F1q5gr6pb0?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Tláhuac | https://www.google.com/maps/place/Agama+Tlahuac+-+CDMX/@19.3139921,-99.0731413,17z/data=!3m1!4b1!4m6!3m5!1s0x85ce038f45eee785:0x146a2b25a5acc7b6!8m2!3d19.3139871!4d-99.0705664!16s%2Fg%2F11s_x3lx1d?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Zaragoza | https://www.google.com/maps/place/Agama+Zaragoza+-+CDMX/@19.4145111,-99.0905649,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1fc16412c66d9:0x769b454319639ec3!8m2!3d19.4145061!4d-99.08799!16s%2Fg%2F12m9h0875?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Toluca | https://www.google.es/maps/place/Agama+-+Toluca/@19.2717097,-99.5553984,17z/data=!3m1!4b1!4m6!3m5!1s0x85cd8b77e2c5c48b:0x602bc44a6806cc77!8m2!3d19.2717047!4d-99.5528235!16s%2Fg%2F11nqbjx7l6?entry=ttu&g_ep=EgoyMDI2MDcxOS4wIKXMDSoASAFQAw%3D%3D | confirmada por el usuario |
| Online | no aplica | filial digital |

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
| Toluca | ANGEL PALMA AGAMA | PAA-810709 | pendiente de confirmación | pendiente de confirmación | pendiente de confirmación | pendiente de confirmación |

## Pendientes humanos

- `Merced` mantiene el teléfono como pendiente porque el HTML ES actual no lo muestra.
- `Toluca` queda confirmado por usuario como `ANGEL PALMA AGAMA` y RFC `PAA-810709`; los datos bancarios quedan retirados de la página hasta confirmación explícita.
- Cualquier confirmación humana posterior debe actualizar este baseline y `CHANGELOG.md` en el mismo cambio.

## Confirmaciones humanas incorporadas

- `Ecatepec`: dirección confirmada como `Avenida Emiliano Zapata No.3, Col. Urbana Ixhuatepec, 55349, Ecatepec de Morelos, Méx., México`.
- `Cuautitlán`: dirección confirmada como `Carr. Tlalnepantla - Cuautitlan 19, Loma Bonita, 54759 Cuautitlán Izcalli, Méx., México`.
- `Toluca`: WhatsApp confirmado como `+52 722 499 7514` y teléfono fijo confirmado como `+52 722 946 8099`; son canales distintos.

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
   - la URL canónica de Google Maps si afecta a una filial física
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
