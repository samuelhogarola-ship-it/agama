# Política Inmutable De Datos Sensibles De Filiales

## Regla Absoluta

**PROHIBIDO modificar datos bancarios o fiscales, direcciones, enlaces de Maps, teléfonos, WhatsApp o correos de cualquier filial sin autorización escrita del propietario y una foto nueva que demuestre el dato autorizado.**

Una petición genérica de “corregir”, “actualizar”, “revisar” o “mergear” no autoriza por sí sola a cambiar estos datos.

## Triple Protección

1. **Bloqueo local inmutable**
   - `data/filiales-sensitive-data.lock.json` conserva la instantánea exacta de ES y EN.
   - `npm run validate:filiales-sensitive-lock` compara todas las apariciones protegidas.
   - La validación se ejecuta antes de cada commit y antes de cada push.

2. **Huella independiente en GitHub**
   - GitHub conserva `FILIALES_SENSITIVE_LOCK_SHA256` fuera del repositorio.
   - Una PR no puede sustituir simultáneamente los datos, el lock y el validador para saltarse la comprobación.
   - El workflow de control se ejecuta desde la rama base y nunca ejecuta código de la PR.

3. **Aprobación humana protegida**
   - Una alteración real de datos activa el entorno `filiales-sensitive-data`.
   - La PR queda detenida hasta la aprobación expresa del propietario.
   - `main` exige que el control remoto termine correctamente.

## Procedimiento Único De Renovación

Solo se puede renovar el lock cuando se cumplen todos estos puntos:

1. El propietario escribe exactamente qué filial y qué dato cambia.
2. El propietario adjunta una foto nueva que muestre el dato.
3. Se calcula y registra el SHA-256 de esa foto; la foto no se incorpora al repositorio.
4. La renovación registra también la huella SHA-256 de la autorización escrita.
5. El propietario actualiza la huella independiente de GitHub.
6. El propietario aprueba manualmente el entorno protegido de la PR.

Si falta cualquiera de los seis puntos, el cambio se rechaza.

## Alcance Protegido

- Banco, sucursal, cuenta, cuenta interbancaria o CLABE.
- Razón social y RFC.
- Dirección postal, localidad, código postal y enlaces de Maps.
- Teléfono, WhatsApp y todos sus enlaces.
- Correo y todos sus enlaces.
- Las mismas apariciones dentro de JSON-LD.
- Versiones española e inglesa, incluido el hub de filiales.

El diseño, el contenido comercial y la estructura visual pueden cambiar siempre que la instantánea sensible permanezca idéntica.
