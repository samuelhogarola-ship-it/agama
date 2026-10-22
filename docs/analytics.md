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

El archivo fuente `analytics-config.js` no contiene IDs productivos. En build, `build.js` escribe `dist/assets/js/analytics-config.js` con las variables disponibles en el entorno y, si faltan, usa la configuración pública de `config/analytics.production.json`.

Las variables del despliegue siguen teniendo prioridad. Para sustituir la configuración de Umami deben existir ambas:

```text
AGAMA_UMAMI_SRC=https://analytics.2.24.10.239.sslip.io/script.js
AGAMA_UMAMI_WEBSITE_ID=<website-id de AGAMA en Umami>
```

La comprobación funcional es abrir la web pública, confirmar una petición a `/script.js` y otra a `/api/send`, y verificar la visita en el panel de Umami.

## Blogger

El panel está en `/admin/blogger/`. Usa la cuenta de cliente de Supabase y exige que el correo figure en `AGAMA_ADMIN_EMAILS` (lista separada por comas). Variables del despliegue:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `AGAMA_ADMIN_EMAILS`
- `AGAMA_CONTENT_DIR=/data/agama-blogger`

El directorio de contenido debe estar montado como volumen persistente en Coolify. Los borradores, posts publicados e imágenes se conservan allí y se regeneran al arrancar el contenedor.

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
