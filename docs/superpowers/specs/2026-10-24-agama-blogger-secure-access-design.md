# Diseño de acceso seguro a AGAMA Blogger

**Fecha:** 24 de octubre de 2026

**Estado:** aprobado conceptualmente por el usuario

**Origen funcional:** PR #172, commit `1018bb0` del 22 de octubre de 2026

## Línea base verificada

- Worktree aislado creado desde `origin/main` en la rama `codex/blogger-secure-access`.
- `npm run test:blogger`: 12 pruebas superadas, 0 fallos.
- `npm run build`: completado correctamente usando las páginas estáticas comprometidas.
- `npm audit`: 4 avisos high en dependencias de desarrollo (`serve` y transitivas `compression`, `brace-expansion`, `fast-uri`); no pertenecen al servicio Blogger de producción actual. Su corrección debe evaluarse en un cambio independiente porque la solución propuesta para `serve` implica una versión mayor anterior.
- No se ha modificado DNS, Supabase, Coolify ni producción durante esta preparación.

## Objetivo

Ofrecer un único Blogger de AGAMA, reconocible como módulo del cliente, con dos entradas a la misma identidad y los mismos permisos:

1. Entrada principal desde Panel Cliente mediante un código temporal de un solo uso.
2. Entrada directa de contingencia en `https://blogger.agama.com.mx/` mediante correo y contraseña, con recuperación de contraseña.

El resultado no debe crear cuentas duplicadas, compartir credenciales ni convertir una URL oculta en una medida de seguridad.

## Alcance y fases

### Fase 1A: subdominio y presentación

- Servir el editor en `blogger.agama.com.mx` sin alterar las rutas públicas del blog.
- Mantener temporalmente `/admin/blogger/` durante la validación; redirigirlo sólo en el corte final.
- Cambiar el verde del editor por el azul corporativo AGAMA `#1745f5`, con azul oscuro `#0f2f99`.
- Marcar el editor como `noindex, nofollow` y aplicar cabeceras de seguridad.
- Verificar localmente el host nuevo, el host público y las rutas del blog antes de tocar DNS.

### Fase 1B: acceso directo y endurecimiento

- El navegador debe reconocer correo y contraseña mediante los atributos `autocomplete` estándar.
- El navegador no guardará tokens en `localStorage`; la sesión se mantendrá en cookies `HttpOnly`, `Secure` y `SameSite=Strict` emitidas por el servicio.
- Supabase Auth seguirá siendo el almacén de identidad y contraseñas. Ninguna contraseña, enlace mágico, secreto TOTP o token humano se guardará en el repositorio ni en `.env`.
- Habrá recuperación de contraseña por correo y cambio de contraseña desde el enlace de recuperación.
- Los roles autorizados serán `client_publisher` y `studio_admin`. Ambos pueden crear, editar y publicar para AGAMA; no se inferirá autorización sólo por haber iniciado sesión.
- Las listas de identidades/roles de despliegue deberán configurarse explícitamente y fallar de forma cerrada. Se eliminará el administrador predeterminado incluido en código.
- Se limitarán intentos de login y recuperación, se comprobará el `Origin` en operaciones mutables y se registrarán accesos y publicaciones sin datos secretos.
- El HTML editorial se saneará en el servidor antes de guardarse/publicarse y las imágenes se validarán por tamaño, extensión y firma.
- La publicación fallará si falta el marcador administrado del índice; nunca añadirá contenido silenciosamente al final de `<body>`.
- El slug de una entrada publicada será inmutable para evitar romper rutas. Los borradores sí podrán renombrarse.

### Fase 2: acceso desde paneles

- Panel Cliente mostrará un único acceso llamado **Blogger**.
- Al abrirlo generará un código aleatorio, de un solo uso, con caducidad corta, vinculado a usuario, cliente AGAMA, audiencia Blogger y URL de retorno.
- Blogger intercambiará el código en servidor por la misma sesión que usa el acceso directo; el código no aparecerá en logs ni podrá reutilizarse.
- WF Studio usará la identidad central `info@webfuengirola.com` con rol `studio_admin` para los clientes autorizados, sin una contraseña distinta por cliente.
- TOTP/Authenticator será obligatorio sólo para la cuenta maestra de WF Studio. No será requisito para los clientes.
- La cuenta de emergencia será distinta de la cuenta diaria, tendrá contraseña larga guardada en un gestor seguro y uso auditado.
- Esta fase exige inspeccionar y planificar por separado los repositorios reales de Core General, Studio Panel y Panel Cliente.

## Modelo de identidad y permisos

Una persona tiene una identidad. El acceso desde panel y el directo deben resolver al mismo `user_id`; no se crearán cuentas paralelas.

| Rol | Acceso | Alcance | MFA |
| --- | --- | --- | --- |
| `client_publisher` | Panel Cliente o login directo | Crear, editar y publicar sólo para AGAMA | No obligatorio |
| `studio_admin` | WF Studio o login directo de contingencia | Administrar y editar los clientes autorizados | Obligatorio en WF Studio |

La autorización se comprobará en servidor en cada petición. El frontend sólo representa capacidades ya autorizadas.

## Límites de confianza

- `www.agama.com.mx` sigue siendo la web pública.
- `blogger.agama.com.mx` contiene únicamente el editor y su API.
- Supabase Auth valida identidad; el servicio Blogger decide el rol y el alcance AGAMA.
- Los secretos de servicio se configuran en el entorno de despliegue. Las claves públicas de Supabase pueden exponerse al cliente, pero no conceden autorización editorial.
- El contenido publicado se considera entrada no fiable hasta pasar validación y saneado.

## Flujo directo

1. El usuario abre `blogger.agama.com.mx`.
2. Envía correo y contraseña al endpoint de login del mismo origen.
3. El servicio intercambia las credenciales con Supabase, obtiene el usuario y comprueba rol/alcance.
4. El servicio emite cookies de sesión inaccesibles a JavaScript.
5. El navegador abre el editor. Al cerrar sesión, el servicio revoca/borra las cookies.
6. En “Olvidé mi contraseña”, Supabase envía un enlace cuya URL de retorno está restringida al subdominio Blogger.

## Flujo desde Panel Cliente (fase 2)

1. Panel Cliente autentica al cliente mediante Magic Link.
2. El cliente pulsa **Blogger**.
3. El backend del panel crea un código opaco de un solo uso con caducidad máxima de 60 segundos.
4. El navegador llega a Blogger con el código.
5. El backend Blogger valida emisor, audiencia, cliente, usuario, caducidad, `nonce` y ausencia de uso previo; después emite la sesión normal y elimina el código de la URL.
6. Si falla cualquier comprobación, no crea sesión y ofrece el login directo.

El código temporal es una autorización limitada, no una llave maestra.

## Despliegue seguro

Cada cambio seguirá esta puerta:

1. Un solo bloque de cambio en rama/worktree aislado.
2. Prueba unitaria/integración y comprobación local del flujo afectado.
3. Revisión del diff y verificación de que no contiene secretos.
4. Despliegue de vista previa o prueba con cabecera `Host`.
5. Sólo después, merge/despliegue y smoke test de producción.
6. No comenzar ni subir el siguiente bloque hasta registrar el resultado del anterior.

El cambio DNS será el último paso de la Fase 1A. Debe poder revertirse eliminando el registro y manteniendo `/admin/blogger/` operativo durante la ventana de validación.

## Fuera de alcance

- Cambios de precios o catálogo.
- Sustituir Google Tag Manager por Umami; ambos permanecen independientes.
- Cambiar rutas públicas de `/blog/` o `/entrada-de-blog/.../` salvo la generación controlada de una publicación.
- Guardar credenciales humanas en archivos de entorno.
- Generalizar SSO antes de inspeccionar los repositorios de los paneles.

## Criterios de aceptación

- La web pública y todas las rutas existentes del blog responden igual antes y después del corte.
- El editor usa el subdominio y los colores corporativos, no aparece en buscadores y no filtra secretos.
- El cliente puede entrar desde panel o directamente con la misma cuenta.
- La recuperación de contraseña funciona y no revela si existe una cuenta.
- Un usuario autenticado sin rol AGAMA recibe `403`.
- Una sesión caducada o revocada no permite leer ni publicar.
- Un código temporal caducado o reutilizado no crea sesión.
- El usuario de WF Studio usa MFA en el panel maestro; los clientes no están obligados a usarlo.
- Cada bloque se valida antes de iniciar el siguiente.
