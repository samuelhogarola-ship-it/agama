# Guardrails de datos para filiales

Este repo ya no debe tratar las direcciones de sucursales como texto libre repartido por HTML.

## Fuente única de verdad

- Archivo canónico: [`data/branch-directory.json`](../data/branch-directory.json)
- Campos cubiertos hoy:
  - `name`
  - `city`
  - `status`
  - `address` o `hubAddress`
  - `phone`
  - `whatsapp`
  - `website`

## Scripts obligatorios

- `npm run branches:sync`
  - propaga el dato canónico al hub y a las landings ES/EN.
- `npm run branches:audit`
  - falla si `meta`, `topbar`, `hub` o bloque de contacto se desincronizan.

## Regla para migraciones

Cada migración, restauración o edición masiva de `filiales/` debe seguir este orden:

1. editar `data/branch-directory.json`
2. correr `npm run branches:sync`
3. correr `npm run branches:audit`
4. correr `npm test`

## Qué protege este control

Evita que una misma sucursal termine con:

- una dirección en el hub,
- otra en el `meta description`,
- otra en el `topbar`,
- y otra distinta en el bloque de contacto.
