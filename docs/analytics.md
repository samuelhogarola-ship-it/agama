# Analytics Runtime

AGAMA usa un cargador compartido en `assets/js/analytics.js` y una configuracion inerte en `assets/js/analytics-config.js`.

## Variables

- `AGAMA_GTM_ID`: ID del contenedor Google Tag Manager.
- `AGAMA_GA4_ID`: ID de medicion Google Analytics 4.
- `AGAMA_UMAMI_WEBSITE_ID`: website id de Umami.
- `AGAMA_UMAMI_SRC`: URL del script de Umami.

Si una variable falta, ese proveedor no carga y la pagina no falla.

## Sitio estatico

Las paginas publicas cargan:

- `assets/js/analytics-config.js`
- `assets/js/analytics.js`

El archivo versionado `analytics-config.js` no contiene IDs productivos. En build, `build.js` escribe `dist/assets/js/analytics-config.js` con las variables disponibles en el entorno.

GTM ya no usa un iframe `noscript` hardcodeado. Para recuperarlo haria falta inyectar un snippet server-side/build-time con `AGAMA_GTM_ID`; no se debe escribir un ID productivo en HTML fuente.

## Portal Next

El portal solo renderiza GA4 si `AGAMA_GA4_ID` existe en el entorno del servidor/build. Sin esa variable, `next/script` queda inerte.

## Eventos De Conversion

El loader emite eventos con nombre `agama_<tipo>` hacia:

- `dataLayer`: `{ event: "agama_conversion", agama_event: "<tipo>", ...payload }`
- `gtag`: `gtag("event", "agama_<tipo>", { event_category: "conversion", ...payload })`
- Umami: `umami.track("agama_<tipo>", payload)`

Tipos automáticos:

- `contact`: enlaces a `/contacto` o `mailto:`
- `whatsapp`: enlaces a WhatsApp
- `phone`: enlaces `tel:`
- `form`: envio de formularios
- `primary_cta`: enlaces `.g-button`, `.product-wa-btn` o `.prod-card-wa` no clasificados antes
