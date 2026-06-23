# Plan Técnico: Blindaje De Datos De Filiales

## Objetivo

Evitar que las direcciones, teléfonos, WhatsApp, emails, mapas, metadata SEO, JSON-LD y demás datos críticos de filiales vuelvan a modificarse accidentalmente por ediciones manuales dispersas.

Este documento **no aplica cambios**. Solo propone una ruta de migración segura.

## Diagnóstico

El proyecto actual mezcla dos modelos:

- El catálogo de productos sí usa un flujo parcialmente centralizado en `build.js`.
- Las páginas de `filiales/` siguen siendo HTML estático copiado tal cual al build final.

Eso produce un problema claro: los datos críticos de cada filial viven **hardcodeados en muchos sitios a la vez** y no tienen una fuente única verificable.

### Hallazgos principales

- Cada filial tiene al menos dos páginas manuales:
  - `filiales/<slug>/index.html`
  - `filiales/<slug>/index.en.html`
- Existe además un hub manual:
  - `filiales/index.html`
  - `filiales/index.en.html`
- `build.js` **no genera** las páginas de filiales; solo las copia:
  - `build.js` → `COPY_DIRS = ['filiales', ...]`
- Los datos de contacto aparecen repetidos dentro de una misma ficha:
  - CTA principal
  - menú móvil
  - botón flotante WhatsApp
  - bloque de contacto
  - links a Google Maps
  - metadata `<title>`, `<meta description>`, canonical
  - en Toluca también JSON-LD
- `assets/js/global-ui.js` deduce el WhatsApp de la página leyendo el DOM. Eso funciona, pero es frágil: si cambia el markup o el label, puede romper la sincronización.

---

## Datos Confirmados Por Humano

### Contacto y dirección (GBP — confirmado 2026-06-23)

| Filial | Teléfono GBP | Dirección GBP |
|---|---|---|
| Monterrey | +52 81 4105 6270 | Joaquín G. Leal Nte. 988-Local O |
| Puebla | +52 222 418 0483 | sin cambio |
| Querétaro | +52 442 189 4658 | sin cambio |
| San Luis Potosí | +52 444 773 4771 | Av. Universidad San Luis 2045-4 |
| Chalco | +52 55 3092 0925 | Carretera México-Cuautla Km.1, Col. Casco de San Juan, 56600 |
| Cuautitlán | +52 55 5870 4027 | Carretera Tlalnepantla Cuautitlán 19, Col. Loma Bonita, 54759 |
| Ecatepec | +52 55 5714 7170 | Avenida Emiliano Zapata No.3, Col. Urbana Ixhuatepec, 55349 |
| Ermita | +52 55 2608 8600 | Calz. Ermita Iztapalapa 1697, Col. Santa María Aztahuacan, 09500 |
| León | +52 477 718 9302 | Blvd. Hermanos Aldama 2501, Col. Industrial La Pompa |
| Merced | sin teléfono en GBP | Fray Servando Teresa de Mier 507, Merced Balbuena, 15810 CDMX |
| Guadalajara | +52 33 4387 0267 | Calzada Lázaro Cárdenas No.2380 Local 23, Col. Del Fresno |
| Zaragoza | +52 55 5571 2933 | Calz. Ignacio Zaragoza No.547, Col. Ignacio Zaragoza, 15000 CDMX |
| Tláhuac | +52 55 5850 9148 | Avenida Tláhuac No.4803, Col. San Lorenzo, 00900 Iztapalapa |
| Texcoco | +52 55 8991 8216 | Avenida Texcoco No.170, Mexico 1ra Sección, 57620 Nezahualcóyotl, Méx. |
| Pantitlán | +52 55 2232 7179 | Avenida Pantitlán No.337-289, Col. Evolución, 57700 Nezahualcóyotl, Méx. |

### Datos fiscales y bancarios (confirmado 2026-06-23)

| Filial | Titular | RFC | Banco | Sucursal | Cuenta | CLABE |
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
| Online | Dorcil de Jhomms S.A. de C.V. | DJH-111124-GP5 | Banamex | 7001 | 7261-434 | 002-180-700-172-614-348 |
| Toluca | PALMA AGAMA ANGEL | PAAA-810709-JF0 | Banamex | — | — | — ¹ |

> ¹ Toluca muestra solo nombre y banco. Cuenta y CLABE pendientes de confirmar.

---

## Conflictos Pendientes De Confirmación Humana

No se debe elegir automáticamente una versión.

### 1. Puebla y Querétaro — dirección

La confirmación indica `sin cambio` en dirección, pero no fija el string canónico final.

Pendiente:
- decidir el texto exacto de dirección para `Puebla`
- decidir el texto exacto de dirección para `Querétaro`

### 2. Merced — teléfono

Merced no tiene teléfono en GBP. Confirmar si debe quedar vacío o si existe número nuevo.

### 3. Toluca — datos bancarios incompletos

La ficha muestra banco (Banamex) y titular pero no cuenta ni CLABE. Pendiente confirmar.

### 4. Toluca — normalización de formato

Inconsistencias internas:
- `Santa Maria` vs `Santa María`
- `Méx., México` vs `State of Mexico, Mexico`
- descripciones cortas vs JSON-LD más completo

### 5. Normalización ortográfica general

- `Mexico 1ra Sección` vs forma acentuada
- formatos abreviados vs completos (`CDMX`, `Ciudad de México`, `Estado de México`, `Méx.`)

No corregir automáticamente sin validación humana.

---

## Archivos Encontrados

### 1. Páginas de filiales

- `filiales/index.html` / `filiales/index.en.html`
- `filiales/<slug>/index.html` / `filiales/<slug>/index.en.html` × 17 slugs

### 2. Fuentes compartidas relacionadas

- `build.js` — copia `filiales/`, genera nav/footer, concentra WhatsApp corporativo
- `assets/js/global-ui.js` — detecta páginas de filiales, sincroniza WhatsApp leyendo DOM
- `sitemap.xml` — dependencia manual si filiales se reindexan
- `nginx.conf` — redirecciones y acceso a `/filiales`

### 3. Otras páginas con referencias a filiales

`productos/`, `eventos/`, `legal/`, `entregas/`, `vacantes/`, `blog/`, fichas de productos.

---

## Riesgos Actuales

1. Cambio "rápido" en una ficha puede dejar: dirección visible correcta pero meta description vieja, Maps viejo, WhatsApp viejo, hub viejo.
2. Hub puede divergir de fichas individuales sin que nadie lo note.
3. Versiones ES/EN pueden divergir por edición manual.
4. Datos bancarios son especialmente sensibles y comparten superficie de edición con contenido visual.
5. No hay validación previa al deploy para detectar campos faltantes, formatos inválidos, conflictos ES/EN, ni inconsistencias entre hub, metadata y ficha.
6. `build.js` no gobierna filiales.

---

## Propuesta De Fuente Única

### Fuente preferida

`src/data/filiales.ts`

### Estructura sugerida

```ts
export interface FilialData {
  slug: FilialSlug;
  status: "active" | "online" | "opening-soon" | "disabled";
  branchName: string;
  locale: {
    es: { title: string; metaDescription: string; shortAddress: string; fullAddress: string; };
    en: { title: string; metaDescription: string; shortAddress: string; fullAddress: string; };
  };
  contact: {
    landline?: string;
    whatsapp: string;
    email?: string;
  };
  location: {
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    countryCode: "MX";
    mapsUrl?: string;
  };
  seo: { canonicalEs: string; canonicalEn: string; };
  sensitive?: {
    rfc?: string;
    legalName?: string;
    bank?: string;
    branchNumber?: string;
    accountNumber?: string;
    clabe?: string;
  };
}
```

### Regla operativa

- Cualquier cambio de dirección, teléfono, email, WhatsApp, mapa, metadata o datos bancarios se hace **solo** en `src/data/filiales.ts`.
- Las páginas y artefactos derivados se regeneran desde ahí.

---

## Reglas Para Futuras Tareas Con IA

1. No editar direcciones, teléfonos, WhatsApp, emails, mapas, metadata, JSON-LD ni datos bancarios directamente en HTML si `src/data/filiales.ts` ya existe.
2. No corregir ortografía de una dirección sin confirmación humana si afecta: numeración, colonia, municipio, código postal o entidad federativa.
3. Si se detectan dos versiones distintas para una filial: reportar el conflicto, no elegir automáticamente.
4. No introducir nuevos `wa.me/`, `mailto:` o `google.com/maps` hardcodeados fuera de la capa derivada.
5. Toda nueva ficha debe partir del dataset, no de copiar/pegar otra ficha.
6. Los datos bancarios/fiscales deben editarse en bloque y revisarse por humano antes de publicar.
7. Si una tarea pide "solo cambiar el copy", evitar tocar campos críticos aunque estén en el mismo archivo.

---

## Plan De Migración Por Fases

### Fase 0 — Confirmación humana de conflictos pendientes (ver sección arriba)

### Fase 1 — Crear `src/data/filiales.ts` con datos actuales

### Fase 2 — Añadir tipos y helpers (`getFilialBySlug`, `getFilialSeo`, `getFilialJsonLd`)

### Fase 3 — Migrar hub (`filiales/index.html` + `filiales/index.en.html`)

### Fase 4 — Migrar fichas individuales (orden sugerido: toluca → merced → puebla → queretaro)

### Fase 5 — Migrar metadata y JSON-LD

### Fase 6 — Migrar enlaces compartidos (WhatsApp, Maps, bloques de contacto)

### Fase 7 — Crear `scripts/validate-filiales-data.mjs` e integrar a precommit/CI

---

## Historial De Cambios

| Fecha | Cambio | PR |
|---|---|---|
| 2026-06-23 | Sync direcciones a GBP en hub ES/EN y ficha SLP | #56 |
| 2026-06-23 | Fix datos bancarios Ermita y Ecatepec: BBVA → Banamex | — |
