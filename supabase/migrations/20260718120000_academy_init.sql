-- Academia AGAMA — esquema inicial (diseñado para convivir con el proyecto
-- de producción ozexoekvshuhtkrleuze sin tocar nada existente):
--   * Todas las tablas llevan prefijo academy_
--   * Sin triggers sobre auth.users (el perfil se crea desde el cliente)
--   * Sin create-or-replace de funciones genéricas
-- Aplicar pegando este archivo en el SQL editor del dashboard.

-- ─── Perfiles de colaboradores en formación ──────────────────────────────────
create table if not exists public.academy_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  filial text,
  level text not null default 'recluta',
  created_at timestamptz not null default now()
);

alter table public.academy_profiles enable row level security;

create policy "academy_profiles: leer el propio" on public.academy_profiles
  for select using (auth.uid () = id);

create policy "academy_profiles: insertar el propio" on public.academy_profiles
  for insert with check (auth.uid () = id);

create policy "academy_profiles: actualizar el propio" on public.academy_profiles
  for update using (auth.uid () = id);

-- ─── Progreso de items (capítulos, guías, evaluaciones) ──────────────────────
create table if not exists public.academy_lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_slug text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

alter table public.academy_lesson_progress enable row level security;

create policy "academy_progress: leer el propio" on public.academy_lesson_progress
  for select using (auth.uid () = user_id);

create policy "academy_progress: insertar el propio" on public.academy_lesson_progress
  for insert with check (auth.uid () = user_id);

create policy "academy_progress: actualizar el propio" on public.academy_lesson_progress
  for update using (auth.uid () = user_id);
