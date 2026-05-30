create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  webflow_item_id  text unique,
  slug             text unique not null,
  nombre           text not null,
  tipo_producto    text,          -- pigmentos | masterbatch | aditivos
  tipo             text,
  acabado          text,
  color            text,
  precio           numeric,
  descripcion      text,
  informacion      text,          -- HTML rico de Webflow
  ficha_tecnica    text,          -- URL PDF
  portada          text,          -- URL imagen
  galeria          text,          -- URLs separadas por coma
  published        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.products enable row level security;

-- Lectura pública (catálogo)
grant select on public.products to anon, authenticated;
-- Solo staff puede modificar
grant all on public.products to authenticated;

create policy "public_read_products"
  on public.products for select to anon using (published = true);

create policy "authenticated_all_products"
  on public.products for all to authenticated using (true);

create index if not exists idx_products_tipo on public.products (tipo_producto);
create index if not exists idx_products_slug on public.products (slug);
