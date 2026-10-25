# Cambio de WhatsApp corporativo y aviso temporal — diseño

**Fecha:** 24 de octubre de 2026\
**Estado:** pendiente de aprobación\
**Línea base:** `origin/main` en `494cb35f05c681be4fb54dc1406bde53abf58aa6`

## Intención

Retirar de todas las superficies públicas de AGAMA el WhatsApp corporativo anterior, terminado en `5156`, porque ya no pertenece a la organización, y sustituirlo permanentemente por `+52 55 4860 4275`. Durante una semana, las páginas de mayor contacto deben explicar el cambio de forma clara para reducir mensajes enviados a terceros.

La migración no puede modificar los teléfonos ni los WhatsApp propios de las sucursales. Tampoco debe alterar rutas, precios, Blogger, Google Tag Manager, GA4 ni Umami.

## Decisión

Se adopta una **migración controlada por identidad exacta del número**:

- número visible anterior: `+52 55 7351 5156` y variantes de puntuación equivalentes;
- destino anterior: `525573515156` dentro de `wa.me` o `api.whatsapp.com`;
- número visible nuevo: `+52 55 4860 4275`;
- destino nuevo: `525548604275`;
- se sustituye sólo el número corporativo anterior, nunca cualquier número encontrado en un enlace de WhatsApp;
- antes y después de la migración se conserva un inventario de los números locales de filiales para demostrar que no cambiaron.

El número nuevo es un canal de WhatsApp operado mediante Wasapi.io. Admite mensajes de texto, audios, fotografías, videos y documentos; **no admite llamadas telefónicas ni videollamadas**.

## Alcance permanente y temporal

### Cambio permanente

El número corporativo nuevo sustituye al anterior en todas las fuentes públicas que publica o puede volver a publicar este repositorio:

- enlaces `wa.me` y `api.whatsapp.com`, incluidos mensajes prellenados;
- texto visible, botones, menús, pie de página y widget flotante;
- páginas ES y EN, productos, categorías, blog y entradas, eventos, entregas, vacantes, legal, FAQ y landings;
- generadores y componentes que puedan reintroducir el número antiguo;
- configurador, portal y tema WordPress si esas superficies se publican;
- código QR de WhatsApp y cualquier imagen pública que contenga el número;
- fixtures y pruebas que representen el número vigente.

Los números locales de cada punto de venta quedan expresamente fuera de la sustitución.

### Aviso temporal

El banner se muestra sólo hasta:

- `2026-10-31 23:59:59 America/Mexico_City`;
- instante equivalente: `2026-11-01T05:59:59Z`;
- a partir de `2026-11-01T06:00:00Z` no se renderiza.

El final depende de un instante absoluto, no del idioma ni de la zona horaria del dispositivo. El código del aviso puede permanecer desplegado tras esa fecha, pero no debe producir DOM visible ni ocupar espacio. Su retirada física se hará después en un cambio separado.

## Páginas del banner

El aviso temporal cubre 40 documentos públicos: 20 en español y sus 20 equivalentes en inglés.

| Grupo | Español | Inglés |
| --- | --- | --- |
| Inicio | `/` | `/index.en.html` |
| Contacto | `/contacto/` | `/contacto/index.en.html` |
| Hub de puntos de venta | `/puntosdeventa/` | `/puntosdeventa/index.en.html` |
| 16 puntos de venta | `/puntosdeventa/{slug}/` | `/puntosdeventa/{slug}/index.en.html` |
| Tienda online | `/filiales/online/` | `/filiales/online/index.en.html` |

Los 16 valores admitidos de `{slug}` son: `chalco`, `cuautitlan`, `ecatepec`, `ermita`, `guadalajara`, `leon`, `merced`, `monterrey`, `pantitlan`, `puebla`, `queretaro`, `san-luis-potosi`, `texcoco`, `tlahuac`, `toluca` y `zaragoza`.

`/filiales/` y las 16 rutas físicas antiguas bajo `/filiales/{slug}/` redirigen mediante Nginx a `/puntosdeventa/`; no se cambia esa arquitectura ni se duplica el banner antes de la redirección. `/filiales/online/` es la excepción que continúa siendo pública y sí recibe el aviso.

## Migración de fuentes y salidas

### Fuentes que pueden regenerar el número

La implementación debe actualizar, como mínimo, las siguientes fuentes identificadas:

- `assets/js/global-ui.js`: fallback corporativo, widget flotante y sincronización de enlaces;
- `assets/js/home.js`: formularios y contingencias que abren WhatsApp;
- `assets/js/online-store.js`: solicitudes preparadas de la tienda online;
- `assets/js/products.js`: cotizaciones y calculadora;
- `build.js`: enlaces de fichas y páginas generadas en `dist/`;
- `scripts/shared-layout.mjs`: navegación y menú móvil compartidos;
- `apps/configurador/src/components/configurator/configurator-page.tsx`;
- `portal/src/lib/mock-store.ts`;
- `wordpress/wp-content/themes/agama-blog/footer.php`;
- `docs/filiales-data-lock-plan.md` y `data/filiales-sensitive-data.lock.json`, únicamente mediante el procedimiento protegido;
- fixtures vigentes en `tests/agama-smoke.spec.js`, `tests/analytics.test.mjs` y `apps/configurador/tests/configurador-smoke.spec.ts`;
- cualquier nueva fuente encontrada por el escaneo exacto previo a la implementación.

`scripts/generate-static-blog.mjs` y los demás generadores deben revisarse aunque no contengan hoy el literal: una regeneración no puede recuperar una plantilla antigua o sobrescribir la migración.

### Salidas públicas comprometidas

El repositorio contiene centenares de HTML estáticos con el número antiguo, entre ellos páginas de productos y entradas del blog. El procedimiento será:

1. Crear un inventario versionable o reproducible de coincidencias exactas del número corporativo anterior, separado por fuente generadora y salida generada.
2. Actualizar primero las fuentes regeneradoras.
3. Regenerar con los comandos oficiales cuando la salida sea determinista (`npm run build`, `npm run blog:generate-static` y los generadores específicos aplicables).
4. Para HTML legado sin generador seguro, aplicar una migración mecánica limitada a las formas exactas del número anterior, conservando query strings y mensajes prellenados.
5. Regenerar `assets/img/qr-whatsapp.png` y `assets/img/qr-whatsapp.webp` desde `https://wa.me/525548604275`, y comprobarlos con un lector QR independiente.
6. Incrementar la versión de caché de los assets afectados; `global-ui.js` no debe permanecer hasta una hora con el fallback anterior.
7. Repetir el inventario y exigir cero apariciones públicas del número anterior.

La carpeta `dist/` es salida de `build.js`; se verifica, pero no se usa para esconder divergencias en fuentes comprometidas. La migración de WordPress exige incorporar explícitamente esa ruta a `docs/change-scope.md` si el tema sigue siendo una superficie desplegada. El propio documento de alcance debe ampliarse antes de comenzar, porque el allowlist actual no incluye todas las rutas necesarias.

## Datos estructurados y semántica de contacto

El JSON-LD de inicio ES/EN presenta hoy el número anterior como `contactPoint.telephone`. Ese campo se eliminará o se sustituirá por un contacto web que no declare capacidad telefónica. El número nuevo **no** se escribirá en `telephone`, `tel:` ni en propiedades equivalentes de llamada.

Si se mantiene un `ContactPoint`, contendrá únicamente información verdadera, por ejemplo:

- `@type: "ContactPoint"`;
- `contactType: "customer service"`;
- `url: "https://wa.me/525548604275"`;
- idiomas disponibles;
- sin propiedad `telephone`.

Los `telephone` de JSON-LD que describen teléfonos reales de sucursales no se modifican. Una prueba debe distinguir expresamente estos teléfonos locales del WhatsApp corporativo.

## Banner accesible

El aviso será una franja no modal en la parte superior del contenido, visualmente integrada con el azul corporativo AGAMA (`#1745f5`, con `#0f2f99` para contraste). No cubrirá navegación, contenido ni controles y no bloqueará el desplazamiento.

Comportamiento propuesto:

- configuración central con ID de campaña, instante de fin, rutas admitidas y copias ES/EN;
- selección de idioma por documento, no por traducción automática;
- región semántica con encabezado asociado; se evita `role="alert"` para no interrumpir a lectores de pantalla en cada navegación;
- enlace principal a `https://wa.me/525548604275`, con nombre accesible que advierta que abre una ventana nueva;
- botón de cierre con etiqueta localizada, foco visible y área táctil mínima de 44 × 44 px;
- cierre persistido sólo para esta campaña mediante una clave como `agama:notice:whatsapp-2026-10`; si el almacenamiento no está disponible, el aviso sigue funcionando;
- sin animación obligatoria; cualquier transición respeta `prefers-reduced-motion`;
- sin datos personales, cookies de marketing ni nueva dependencia;
- en viewport móvil, el número y el CTA no se cortan ni provocan scroll horizontal.

### Copia ES

**Aviso importante: nuevo WhatsApp de AGAMA**

**Octubre de 2026**

Desde ahora, escríbenos al **+52 55 4860 4275**. El número anterior, con terminación **5156**, ya no pertenece a AGAMA. Este canal, operado mediante Wasapi.io, atiende únicamente mensajes, audios, fotografías, videos y documentos. No recibimos llamadas ni videollamadas.

CTA: **Abrir WhatsApp**. Cierre: **Cerrar aviso**.

### Copy EN

**Important notice: AGAMA has a new WhatsApp number**

From now on, message us at **+52 55 4860 4275**. The previous number ending in **5156** no longer belongs to AGAMA. This Wasapi.io-powered channel is only for WhatsApp messages, voice notes, photos, videos and documents. We do not accept phone or video calls.

CTA: **Open WhatsApp**. Close label: **Dismiss notice**.

## Piezas sociales

Se producirán como activos nuevos, sin sobrescribir originales, usando el logo AGAMA existente, azul corporativo, alto contraste y el icono de WhatsApp ya disponible. No se introducirán fotografías de terceros ni recursos con licencia dudosa.

### IG/FB Story — 1080 × 1920 px

Mantener texto esencial dentro de una zona segura central, dejando aproximadamente 250 px libres arriba y abajo para la interfaz de las plataformas.

Copy propuesto:

> AVISO IMPORTANTE\
> Octubre de 2026\
> Cambiamos nuestro WhatsApp\
> **+52 55 4860 4275**\
> La línea anterior, terminación **5156**, ya no pertenece a AGAMA.\
> Sólo mensajes, audios, fotos, videos y documentos.\
> **No llamadas ni videollamadas.**\
> Atención empresarial mediante Wasapi.io.

### Estado/imagen de WhatsApp — 1080 × 1080 px

Copy propuesto:

> NUEVO WHATSAPP AGAMA\
> **+52 55 4860 4275**\
> Guarda este número.\
> Sólo mensajes y archivos.\
> **No llamadas ni videollamadas.**\
> La terminación 5156 ya no pertenece a AGAMA.

Ambas piezas deben tener versión PNG final, archivo fuente editable si el flujo lo permite, texto legible a tamaño de teléfono y verificación visual al 100 %. No se codificará la fecha de caducidad dentro de la imagen: la publicación y retirada social se gestionan externamente.

## Analítica: GTM, GA4 y Umami intactos

No se cambia `config/analytics.production.json`, `assets/js/analytics-config.js`, la inicialización de `assets/js/analytics.js` ni las variables de despliegue. GTM continúa con su fallback vigente y Umami sigue siendo adicional, no sustitutivo.

Los enlaces nuevos conservan la clasificación existente de conversión `whatsapp`. El banner puede reutilizar esa medición sin crear un tracker, ID o evento paralelo. Las pruebas deben confirmar exactamente una carga de cada tracker configurado y que el click del banner llega a `dataLayer`, `gtag` y Umami con los nombres actuales.

## Protección especial de filiales

La sustitución afecta `/filiales/online/index.html` y `/filiales/online/index.en.html`, incluidos texto visible y enlaces. Esas rutas están protegidas por `docs/filiales-sensitive-data-policy.md`; la autorización escrita de esta solicitud no basta por sí sola.

Antes de tocar esos archivos se requiere:

1. evidencia adjunta del propietario o de Wasapi.io que muestre `+52 55 4860 4275` como número autorizado de AGAMA;
2. SHA-256 de la evidencia, sin incorporar la evidencia sensible al repositorio;
3. SHA-256 de la autorización escrita;
4. renovación de `data/filiales-sensitive-data.lock.json` con ambas huellas;
5. actualización independiente del secreto de GitHub `FILIALES_SENSITIVE_LOCK_SHA256`;
6. aprobación del workflow remoto `Sensitive Data Lock / Required gate` ejecutado desde la rama base.

Hasta completar los seis puntos, esas dos rutas no se modifican ni se fuerza el validador. El banner puede diseñarse centralmente, pero su activación en `/filiales/online/` debe esperar a que el flujo protegido permita el cambio asociado.

## Pruebas y criterios de aceptación

### Migración permanente

- Escaneo exacto de archivos servidos, fuentes y build: cero apariciones de `525573515156`, `+52 55 7351 5156` o variantes corporativas equivalentes.
- Todos los enlaces corporativos resuelven a `https://wa.me/525548604275` y conservan sus mensajes prellenados.
- Los números y enlaces de las 16 sucursales coinciden byte por byte con la línea base salvo los archivos explícitamente autorizados por el lock.
- `npm run build` completa y el escaneo de `dist/` también da cero residuos.
- Las salidas de blog y layouts regenerados no reintroducen el número antiguo.
- Los dos QR decodifican al destino nuevo.
- El JSON-LD no presenta `+52 55 4860 4275` como teléfono; los teléfonos reales de sucursales permanecen.

### Banner

- Playwright verifica las 40 páginas en desktop y móvil, en ES y EN.
- Se muestra a `2026-10-31 23:59:58 America/Mexico_City` y no se muestra a partir de `2026-11-01 00:00:00`.
- El cierre afecta sólo a la campaña actual, sobrevive a una recarga y no rompe el aviso si `localStorage` falla.
- Navegación por teclado, nombre accesible, foco visible, contraste AA, ausencia de scroll horizontal y respeto de movimiento reducido.
- Las rutas fuera de la allowlist no muestran el aviso.
- Redirecciones `/filiales/{slug}/` continúan llevando a `/puntosdeventa/{slug}/` sin bucles ni rutas nuevas.

### Regresión y seguridad

- `npm run test:analytics`, `npm run test:public`, pruebas de configurador y portal afectadas, validadores de filiales y `npm run precommit:check` en verde.
- GTM, GA4 y Umami conservan configuración, carga única y eventos actuales.
- No aparecen secretos, tokens, credenciales, números privados ni cambios de precios.
- Revisión visual local de banner y piezas sociales antes de cualquier publicación.

## Secuencia de implementación y commits

Cada bloque se prueba localmente y se revisa antes de crear el commit siguiente. No se acumulan ni se suben dos cambios sin comprobar el primero.

1. **Pruebas e inventario:** añadir el escaneo exacto, la línea base de números locales y pruebas de expiración inicialmente fallidas.
2. **Fuentes permanentes no protegidas:** actualizar constantes, generadores, portal/configurador y WordPress autorizado; ejecutar sus pruebas.
3. **Salidas y QR:** regenerar, migrar HTML legado con coincidencia exacta, actualizar cache-busting, generar QR y verificar build/residuos.
4. **Filiales protegidas:** sólo tras evidencia y huellas, actualizar `filiales/online` ES/EN y renovar el lock de forma atómica; pasar validadores local y remoto.
5. **Banner temporal:** implementar configuración, estilos, idiomas, allowlist y accesibilidad; ejecutar Playwright en las 40 páginas y en límites de tiempo.
6. **Piezas sociales:** generar Story y cuadrado, verificar dimensiones, legibilidad, marca y destino escrito.
7. **Verificación final:** suite completa, diff sin secretos, navegación local y comprobación de GTM + Umami; sólo entonces preparar integración/despliegue.

El despliegue mantiene la misma disciplina: un bloque, smoke test de producción y evidencia del resultado antes del bloque siguiente.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Reemplazar WhatsApp de una sucursal | Coincidencia exacta del número corporativo y snapshot de números locales antes/después. |
| Una fuente vuelve a generar `5156` | Actualizar primero generadores, construir desde cero y escanear fuente más `dist/`. |
| Caché conserva el número anterior | Bump de versión en JS/CSS y smoke test en una sesión limpia. |
| Se interpreta WhatsApp como teléfono | Retirar `contactPoint.telephone`, no crear `tel:` y explicitar “no llamadas”. |
| El banner queda visible después de una semana | Instante absoluto, pruebas de frontera y retirada posterior independiente. |
| El reloj del cliente es incorrecto | Aceptar la degradación limitada del control cliente y programar retirada física tras la ventana; no ampliar infraestructura para un aviso de una semana. |
| Cambio bloqueado en filiales | No eludir el lock; obtener evidencia, hashes y actualizar la huella externa antes del commit protegido. |
| GTM o Umami se alteran al regenerar | Tests de configuración, carga única y eventos antes/después. |
| WordPress queda desactualizado | Confirmar si el tema está desplegado e incluirlo en alcance; si no, documentarlo expresamente como artefacto inactivo. |

## Rollback

- El banner y las piezas sociales se aíslan de la migración permanente para retirarlos sin revertir el número nuevo.
- Si el banner falla, se desactiva por configuración o se revierte sólo su commit; las rutas y el contacto nuevo permanecen.
- Si el nuevo canal no está disponible, se retiran temporalmente los CTA corporativos o se dirigen a contacto web. **Nunca se restaura el número terminado en 5156.**
- Los cambios de filiales y su lock se revierten juntos; no se deja un snapshot desincronizado.
- No hay rollback de rutas, DNS ni analítica porque esta iniciativa no debe modificarlos.

## Alternativas consideradas

1. **Parche mínimo sólo en inicio y contacto.** Es rápido, pero deja productos, blog, generadores, QR y otras superficies enviando clientes al número perdido. Rechazado.
2. **Reemplazo global de cualquier enlace de WhatsApp.** Reduce trabajo manual, pero puede sobrescribir los números propios de sucursales y vulnerar el lock. Rechazado.
3. **Migración controlada seleccionada.** Sustituye sólo la identidad exacta del número corporativo, actualiza fuentes antes que salidas, conserva los números locales, separa el aviso temporal del dato permanente y exige pruebas entre bloques. Tiene más pasos, pero ofrece la trazabilidad y el rollback más seguros.

Una refactorización completa hacia una única configuración de contacto podría reducir duplicación futura, pero se difiere para no mezclarla con el cambio urgente.

## Fuera de alcance

- Cambiar números, direcciones, correos, Maps, datos fiscales o bancarios de sucursales.
- Modificar precios, catálogo o rutas.
- Sustituir GTM por Umami o viceversa.
- Cambiar Blogger, autenticación, DNS, Wasapi.io o credenciales.
- Programar publicaciones o retiradas en Instagram, Facebook o WhatsApp.
- Convertir este aviso temporal en un sistema general de campañas.

## Prerrequisitos que requieren intervención del propietario

- Aportar la evidencia verificable del nuevo número para renovar el lock de filiales.
- Designar a la persona con permisos que actualizará fuera del repositorio el secreto `FILIALES_SENSITIVE_LOCK_SHA256` cuando exista el lock renovado.
- Confirmar cuáles de estas superficies están desplegadas, sus URLs y su flujo de publicación: sitio estático raíz o `dist/`, tema WordPress, portal y configurador. Toda superficie pública activa debe entrar en la migración y en los smoke tests; WordPress además debe incorporarse al alcance permitido.
- Si la evidencia protegida no llega a tiempo, decidir entre retener toda la entrega hasta poder publicar de forma atómica o autorizar explícitamente una primera liberación que excluya `/filiales/online/`. Sin esa decisión no se asumirá una publicación parcial.
