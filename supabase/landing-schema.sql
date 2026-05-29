create extension if not exists pgcrypto;

create table if not exists public.landing_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'agama-home',
  name text not null,
  company text,
  email text not null,
  phone text,
  subject text,
  message text not null,
  page_path text,
  user_agent text
);

create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'agama-home',
  email text not null unique,
  page_path text,
  user_agent text
);

alter table public.landing_contacts enable row level security;
alter table public.newsletter_signups enable row level security;

revoke all on public.landing_contacts from anon, authenticated;
revoke all on public.newsletter_signups from anon, authenticated;

grant insert on public.landing_contacts to anon, authenticated;
grant insert on public.newsletter_signups to anon, authenticated;

drop policy if exists "anon_insert_landing_contacts" on public.landing_contacts;
create policy "anon_insert_landing_contacts"
on public.landing_contacts
for insert
to anon
with check (true);

drop policy if exists "anon_insert_newsletter_signups" on public.newsletter_signups;
create policy "anon_insert_newsletter_signups"
on public.newsletter_signups
for insert
to anon
with check (true);

drop policy if exists "authenticated_insert_landing_contacts" on public.landing_contacts;
create policy "authenticated_insert_landing_contacts"
on public.landing_contacts
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_insert_newsletter_signups" on public.newsletter_signups;
create policy "authenticated_insert_newsletter_signups"
on public.newsletter_signups
for insert
to authenticated
with check (true);
