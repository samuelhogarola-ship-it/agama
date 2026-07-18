# APEX — Aprendizaje y Experiencia

Plataforma interna de formación para nuevos colaboradores de AGAMA. APEX es donde aprendemos, enseñamos y transmitimos el Estilo AGAMA a través de **7 escuelas** (Servicio, Ventas, Liderazgo, Operaciones, Producto, Aprendizaje, Cultura) con **30+ capítulos, guías y evaluaciones**.

> El primer capítulo "¿Qué es APEX?" ya está completo con contenido real. Los demás muestran placeholders.

## Estructura

- **Escuelas:** Siete áreas temáticas que cubren el negocio y la cultura AGAMA.
- **Items:** Capítulos, Guías y Evaluaciones (3 tipos de contenido).
- **Progreso secuencial:** cada colaborador avanza a su propio ritmo; el progreso se guarda automáticamente.
- **Asistente IA:** "Bony Pellet" (renombrable a "Atenea") integrado en Supabase, con contexto de la escuela/item actual.

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Supabase — Auth, `lesson_progress`, Edge Function para la IA
- **IA:** Anthropic Claude vía edge function `assistant`

## Arrancar en local (modo demo)

```sh
npm install
npm run dev
```

La app funciona sin Supabase: registro, sesión y progreso en `localStorage`.

## Conectar Supabase

1. `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
2. `supabase db push` (schema en `../../supabase/migrations/20260718120000_academy_init.sql`)
3. Desplegar la IA:
   ```sh
   supabase functions deploy academy-assistant
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

## Dónde va el contenido

- **Catálogo:** `src/data/catalog.ts` — 30+ items con código APEX, escuela, tipo, duración.
- **Primer capítulo completo:** "¿Qué es APEX?" en `src/data/catalog.ts` (field `body`).
- **Placeholders:** Otros items muestran `[CONTENIDO PENDIENTE]` — edita `catalog.ts` para cargar más contenido real.
- **Cuerpo de capítulo:** objetivo, párrafos de contenido, idea principal, relacionados, frase fundacional.

## Renombrar la IA (Bony Pellet → Atenea)

1. `src/config/brand.ts` → `assistantName: 'Atenea'`
2. `supabase secrets set ASSISTANT_NAME="Atenea"` + redeploy

## Archivos clave

```
src/
  config/brand.ts              # Identidad APEX
  lib/types.ts                 # ItemType, SchoolId, ChapterBody
  lib/gating.ts                # Lógica de desbloqueo y progreso
  data/catalog.ts              # 30+ items APEX con contenido real + placeholders
  data/schools.ts              # 7 escuelas
  auth/AuthContext.tsx         # Auth Supabase + demo mode
  data/ProgressContext.tsx
  pages/Dashboard.tsx          # Panel de escuelas
  pages/SchoolPage.tsx         # Items de una escuela
  pages/ItemPage.tsx           # Contenido de un capítulo/guía/evaluación
  components/AssistantWidget.tsx # Chat Bony Pellet
supabase/ (raíz del repo AGAMA)
  migrations/20260718120000_academy_init.sql  # academy_profiles + academy_lesson_progress
  functions/academy-assistant/index.ts        # Edge function IA
```

## Próximos pasos

- Cargar contenido real en los demás capítulos (editar `catalog.ts`, añadir field `body`).
- Panel de admin / reporting (quién completó qué).
- Roles para formadores (ver progreso por colaborador).
