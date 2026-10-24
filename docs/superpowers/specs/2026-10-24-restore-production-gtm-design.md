# Restaurar GTM en producción — diseño

## Intención

Restaurar el contenedor público `GTM-TWHL8PV2` cuando el despliegue no define `AGAMA_GTM_ID`, manteniendo Umami como analítica adicional.

## Alcance

- Añadir el identificador público de GTM a la configuración versionada de producción.
- Usarlo únicamente como fallback; `AGAMA_GTM_ID` seguirá teniendo prioridad.
- Probar que la configuración sin variables carga simultáneamente GTM y Umami.

## Fuera de alcance

- Blogger, sus rutas y su autenticación.
- Precios, dependencias y el PR #173.
- Restaurar el GA4 directo del portal.
- Despliegue o cambios de infraestructura.

## Enfoques considerados

1. Configurar solo el entorno de despliegue: reduce el diff, pero deja el comportamiento dependiente de una variable ausente y no evita la misma regresión.
2. Restaurar snippets GTM en cientos de HTML: duplica lógica y revierte la centralización existente.
3. **Elegido:** fallback versionado en `config/analytics.production.json`, consumido por el cargador central. Es el cambio mínimo, auditable y compatible con overrides por entorno.

## Condiciones de seguridad

- Ningún archivo HTML ni ruta debe cambiar.
- Umami debe conservar exactamente su ID y URL actuales.
- Una variable `AGAMA_GTM_ID` explícita debe prevalecer sobre el fallback.
- La corrección se mantendrá en una rama/worktree independiente.
