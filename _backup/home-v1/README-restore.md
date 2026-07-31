# Restauración de la home AGAMA v1

Esta copia física conserva la portada estable anterior al rediseño de `/home-v2/`.
El tag remoto de referencia es `home-v1-stable-2026-07-31` y debe resolver al
commit `db52dab03ad77821ce437cd72e074d9d9b883281`.

`_backup/` no forma parte de la lista de directorios que `build.js` copia a
`dist/`. Nunca debe publicarse.

## Contenido

- `index.html` e `index.en.html`: portadas ES/EN estables.
- `assets/css/`: snapshot completo de las hojas disponibles en la versión estable.
- `assets/js/`: snapshot completo del JavaScript disponible en la versión estable.
- `assets/fonts/`, `assets/img/` y `assets/video/`: dependencias físicas necesarias
  para reproducir la portada sin depender de cambios posteriores.

## Restauración selectiva recomendada

1. Obtener el tag y comprobar su destino:

   ```sh
   git fetch origin --tags
   git rev-parse home-v1-stable-2026-07-31^{commit}
   ```

   El resultado esperado es
   `db52dab03ad77821ce437cd72e074d9d9b883281`.

2. Crear una rama de incidencia desde el estado que se vaya a reparar:

   ```sh
   git switch -c codex/restore-home-v1
   ```

3. Restaurar primero únicamente los HTML de entrada:

   ```sh
   cp _backup/home-v1/index.html index.html
   cp _backup/home-v1/index.en.html index.en.html
   ```

4. Comparar las dependencias activas con la copia. Restaurar un recurso solo si
   fue modificado durante el corte de home-v2:

   ```sh
   diff -qr _backup/home-v1/assets assets
   cp _backup/home-v1/assets/css/home-custom.css assets/css/home-custom.css
   cp _backup/home-v1/assets/js/home.js assets/js/home.js
   ```

   Si una incidencia afectó también a recursos compartidos, restaurar únicamente
   los archivos señalados por `diff -qr`. No sobrescribir en bloque cambios
   posteriores ajenos a la home.

5. Construir y validar:

   ```sh
   npm ci
   npm run build
   cmp _backup/home-v1/index.html index.html
   cmp _backup/home-v1/index.en.html index.en.html
   npm run test:public
   git diff --check
   git diff -- index.html index.en.html assets/css/home-custom.css assets/js/home.js
   ```

6. Commit, push y PR de restauración:

   ```sh
   git add index.html index.en.html
   git commit -m "Restore stable AGAMA home v1"
   git push -u origin codex/restore-home-v1
   ```

## Restauración completa por tag

Si el despliegue completo debe volver exactamente al estado anterior, configurar
temporalmente Coolify para desplegar `home-v1-stable-2026-07-31`. No usar
`git reset --hard` sobre `main`. Después, preparar una rama de reversión mediante
`git revert` o la restauración selectiva anterior y pasarla por PR.
