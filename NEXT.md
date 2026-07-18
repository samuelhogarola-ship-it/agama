# NEXT — Estado del proyecto AGAMA (2026-07-18)

## PRs abiertas ahora mismo

| PR | Branch | Estado | Notas |
|----|--------|--------|-------|
| #95 | `feat/academy-app` | En revisión | App de formación interna APEX (en progreso — ver sección APEX más abajo). |
| #84 | `feat/online-store-functional` | Listo para merge | Mergear **después de #83**. AGAMA Online funcional. |
| #83 | `feat/filiales-schema-org` | Listo para merge | Schema.org `LocalBusiness` JSON-LD en 16 filiales. Mergear **primero**. |
| #82 | `feat/agama-online-seo` | DRAFT — bloqueado | Render visual del bucket roto. Necesita imagen transparente. |
| #81 | `feat/configurador-app-promo` | Listo, NO mergear | Chip glassmorphism en hero. **No integrar en producción aún.** |

---

## APEX — App de formación interna (`apps/academy/`)

### Estado actual (PR #95, rama `feat/academy-app`)

La app está operativa en local (`npm run dev --prefix apps/academy`). Incluye:

- **7 escuelas** con progresión lineal estricta: cada item se bloquea hasta completar el anterior; cada escuela se bloquea hasta aprobar el test de la anterior.
- **44 items en catálogo**: 36 capítulos/guías + 7 evaluaciones de escuela + 1 test final global.
- **Quiz interactivo**: opción múltiple, umbral 70%, reintentos ilimitados, auto-completa al aprobar.
- **Acceso sin cuenta**: botón en login que entra como invitado (localStorage), sin tocar Supabase.
- **Supabase** (prod `ozexoekvshuhtkrleuze`): tablas `academy_profiles` + `academy_lesson_progress` con RLS. La migración está en el repo pero **aún no aplicada en producción**.
- **Edge function** `academy-assistant` (proxy Anthropic): código en `supabase/functions/academy-assistant/`. **Aún no desplegada**.

### Pasos de infraestructura pendientes (requieren acceso al dashboard de Supabase)

1. Ir a **SQL Editor** del proyecto `ozexoekvshuhtkrleuze` y pegar y ejecutar el contenido de `supabase/migrations/20260718120000_academy_init.sql`.
2. Desde la raíz del repo: `supabase functions deploy academy-assistant --project-ref ozexoekvshuhtkrleuze`
3. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` (clave real de producción).
4. Opcional: `supabase secrets set ASSISTANT_NAME="Atenea"` cuando se decida el nombre del asistente.
5. Crear el archivo `apps/academy/.env` (está en `.gitignore`) con:
   ```
   VITE_SUPABASE_URL=https://ozexoekvshuhtkrleuze.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_nyvRHJ6eZ3aAfSQjVnBzYg_TdVPqpFL
   ```

### Trabajo pendiente para Codex (sin bloqueos técnicos)

#### 1. Contenido de los 35 capítulos placeholder

Todos los items con `summary: '[CONTENIDO PENDIENTE]'` en `apps/academy/src/data/catalog.ts` necesitan un campo `body: ChapterBody` con:
- `objetivo`: una frase.
- `contenido`: array de 4-8 párrafos.
- `ideaPrincipal`: una frase resumen.
- `relacionados`: array de títulos relacionados.
- `fraseFundacional`: cita o principio.

El primer item completo (`que-es-apex`) sirve de plantilla. Los textos los da el propietario o se generan con IA y él valida.

#### 2. Nombre de la plataforma

Actualmente se llama **APEX** (provisional). Cuando se decida el nombre definitivo, cambiar solo:
- `apps/academy/src/config/brand.ts` → campo `platformName` y `platformFullName`.
- `supabase secrets set ASSISTANT_NAME="NuevoNombre"` en producción.

#### 3. Frases fundacionales (muro de frases)

El catálogo Notion tiene ~33 items de tipo "Frase" (código `APEX-FRA-001`, etc.) que no están en la app. Pendiente:
- Añadir tipo `frase` al catálogo o crear una sección dedicada en el Dashboard.
- Mostrarlas como galería/muro inspiracional.

#### 4. Mejoras de UX pendientes

- **Navegación entre items**: al marcar completado un capítulo, ofrecer botón "Siguiente →" directo al próximo item desbloqueado (en lugar de volver siempre a la escuela).
- **Perfil del colaborador**: pantalla `/perfil` donde el colaborador vea su progreso global, su nivel (Recluta/Especialista) y la filial a la que pertenece. Datos en `academy_profiles`.
- **Certificado de nivel Recluta**: al aprobar el test final, mostrar pantalla de celebración y generar un certificado (PDF o imagen) con nombre, fecha y firma AGAMA.
- **Panel de admin**: vista solo para `role: 'admin'` que muestre progreso de todos los colaboradores por filial. Requiere columna `role` en `academy_profiles`.

#### 5. Tests con contenido real

Los quizzes actuales tienen preguntas placeholder razonables. Cuando el contenido real esté escrito, revisar y ajustar preguntas en `apps/academy/src/data/catalog.ts` en los items con `type: 'evaluacion'`.

---

## Web principal — Pendiente estructural

### QR de productos (sin resolver)
Los QR impresos en producto físico no funcionan. Verificar a qué URLs apuntan y si esas rutas existen y devuelven 200.

### Google reviews — estrategia de captación
El botón "Valorar en Google" está en AGAMA Online. Falta extenderlo a filiales físicas: QR en tienda, WhatsApp post-compra.

### DNS cutover (bloqueado en cliente)
- `www.agama.com.mx` → pedir a Cayman que apunte a `2.24.10.239` y añadir el dominio en Coolify.
- Newsletter Resend: verificar dominio `agama.com.mx` en resend.com/domains.

### Formularios en producción
Confirmar en entorno publicado que contacto, newsletter y vacantes guardan en Supabase y notifican correctamente.

---

## No bloqueante para go-live (web principal)

- 5 fichas de producto sin PDF origen: `ad-304`, `ad-313`, `ad-314`, `ad-315`, `ad-316`.
- `/eventos/`: switch de idioma EN desaparece al hacer scroll — anclar al nav fijo.
- Formularios: cambiar destinatario definitivo de `ceo@agamaeu.com` al correo principal tras el corte.

---

## Después del corte estable

- Preparar matriz de redirecciones desde URLs/dominio antiguo.
- Cloudflare, Coolify detrás de dominio, endurecimiento SSH, backups externos.
- Configurador de colores: definir cuándo integrarlo en producción (PR #81, bloqueado).
