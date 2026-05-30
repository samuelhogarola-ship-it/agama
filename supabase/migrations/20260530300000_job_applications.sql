create table if not exists public.job_applications (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  vacancy      text not null,
  name         text not null,
  phone_mobile text not null,
  phone_fixed  text,
  email        text not null,
  city_state   text not null,
  postal_code  text,
  social_links text,
  message      text,
  source       text default 'agama-vacantes',
  page_path    text,
  user_agent   text
);

alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon, authenticated;
grant insert on public.job_applications to anon;
grant all on public.job_applications to authenticated;

create policy "anon_insert_job_applications"
  on public.job_applications for insert to anon with check (true);
create policy "authenticated_all_job_applications"
  on public.job_applications for all to authenticated using (true);
