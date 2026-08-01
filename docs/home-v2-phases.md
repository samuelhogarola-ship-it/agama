# AGAMA Home V2 - fases y estructura

## Fase 0 - base limpia y alcance

Estado: cerrada en `db171d8`.

Objetivo: dejar `/home-v2/` como preview aislada, no indexable y sin bloques provisionales que parezcan diseño final. La pagina debe conservar solo la base funcional necesaria para revisar el flujo: navegacion, hero provisional, transicion de red, newsletter y footer.

No se construye todavia: hero final, sticky deck stack, configurador integrado, galeria editorial, servicios finales ni sustitucion de la home actual.

El mapa de filiales queda congelado por ahora. No se invierte mas tiempo en ajustar marcadores hasta que se apruebe si el bloque de filiales se queda en portada, se traslada a `/filiales/` o se sustituye por una solucion visual mas simple.

## Estructura final prevista

1. Navegacion principal
   - Misma base funcional de la web actual.
   - Enlaces absolutos desde `/`.
   - Una sola inicializacion progresiva del menu.

2. Hero cinematico
   - Video de maxima calidad disponible.
   - Montaje con cambios de ritmo, velocidad y seleccion de tomas.
   - H1 claro y AGAMA como senal de primer viewport.
   - CTAs principales debajo del mensaje, sin cajas innecesarias.

3. Transicion de filiales
   - Bloque ligero justo debajo del hero.
   - Presencia de Mexico y filiales AGAMA con lectura premium.
   - Interaccion simple y revisable antes de ampliar `/filiales/`.

4. Producto 1 - Pigmentos
   - Seccion a pantalla completa.
   - Fotografia existente como base inicial.
   - Estetica editorial inspirada en el H1 de Verdu.
   - Enlace a `/productos/pigmentos/`.

5. Producto 2 - Masterbatch
   - Seccion a pantalla completa.
   - Referencia visual de color AGAMA, por ejemplo negro Kalo brillante cuando se apruebe.
   - Enlace a `/productos/masterbatch/`.

6. Producto 3 - Aditivos
   - Seccion a pantalla completa.
   - Enfoque en funcionalidad, proceso y aplicacion.
   - Enlace a `/productos/aditivos/`.

7. Configurador de color
   - Debajo de los tres productos.
   - Integrado como seccion visual con fotografia original.
   - Sin aspecto de tarjeta independiente.
   - No se toca el configurador existente hasta aprobar esta integracion.

8. Galeria editorial
   - Collage de productos, color, aplicaciones y proceso.
   - Referencia compositiva: Verdu.
   - Usar fotos reales disponibles o prompts aprobados.

9. Servicios finales
   - Conservar los cuatro bloques actuales.
   - Regularizar tamanos y encuadres.
   - Sustituir imagenes mas adelante solo con material aprobado.

10. Blog, CTA, newsletter y footer
    - Mantener contenido y rutas existentes.
    - Ajustar jerarquia visual al final.
    - Footer debe mantenerse como antes salvo ajuste minimo de compatibilidad.

## Prompts y materiales pendientes

- Prompt para mejorar o regenerar el video hero.
- Prompt de montaje del video: velocidades, planos, ritmo y transiciones.
- Prompt visual para Pigmentos.
- Prompt visual para Masterbatch.
- Prompt visual para Aditivos.
- Prompt para mapa o presentacion de filiales.
- Prompt para fotografia principal del configurador.
- Prompts para imagenes del collage.
- Prompts para regenerar las cuatro imagenes de servicios finales.

## Decisiones pendientes

- Contenido exacto del bloque de filiales: mapa, listado visual, cobertura, entregas o combinacion.
- Si el mapa completo vive solo en portada o tambien como version ampliada en `/filiales/`.
- Fotografias reales disponibles para productos, configurador, collage y servicios.
- Si el video actual se remonta con material existente o necesita nuevas tomas.
- Producto/color exacto que servira como referencia visual por seccion.

## Roadmap pendiente

1. Cerrar AGAMA Online
   - Revisar su PR/worktree activo aparte.
   - Confirmar que los cambios de AGAMA Online no se mezclan con `/home-v2/`.
   - Validar SEO, enlaces, cotizacion y ausencia de cambios en datos sensibles.

2. Hero cinematico
   - Auditar calidad real de los videos disponibles.
   - Definir prompt de mejora o montaje antes de editar.
   - Probar desktop y movil con captura visual.

3. Filiales en portada
   - Decidir si el mapa actual se mantiene, se simplifica o se mueve a `/filiales/`.
   - Si sigue en portada, rehacerlo como bloque ligero y no como pieza dominante.
   - Mantener el mapa actual congelado hasta esa decision.

4. Productos sticky deck stack
   - Construir Pigmentos, Masterbatch y Aditivos como tres secciones a pantalla completa.
   - Reutilizar primero las fotos existentes aprobadas.
   - No anadir nuevas imagenes generadas sin aprobacion.

5. Configurador
   - Integrarlo debajo de productos como seccion fotografica.
   - Mantener intacto el configurador existente hasta aprobar la integracion.

6. Galeria editorial
   - Definir composicion tipo collage.
   - Usar fotos reales disponibles o preparar prompts antes de producir assets.

7. Servicios finales
   - Conservar los cuatro bloques actuales.
   - Regularizar tamanos, encuadres y jerarquia.

8. Bloques finales
   - Ajustar blog, CTA, newsletter y footer despues de aprobar la jerarquia visual.
   - Mantener rutas y funciones existentes.

## Guardrails

- No anadir iconos nuevos sin permiso explicito.
- No tocar `index.html`, `index.en.html`, `sitemap.xml`, datos sensibles ni assets productivos fuera del alcance de `/home-v2/`.
- No incluir `/home-v2/` en sitemap.
- Mantener `noindex, nofollow, noarchive`.
- No cargar `home.js`, `global-ui.js` ni `home-custom.css`.
- Chatbase debe cargarse una sola vez.
- GTM queda desactivado en previews, staging y localhost.
- La home actual solo se sustituira cuando `/home-v2/` este aprobada, staging validado y rollback preparado.
