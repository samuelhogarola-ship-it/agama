create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text,
  tax_id text,
  industry text,
  billing_address text,
  shipping_address text,
  contact_preferences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  customer_id uuid references public.customers(id) on delete set null,
  role text not null default 'customer_user'
    check (role in ('customer_user', 'customer_manager', 'agama_support', 'agama_admin')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  accent_color text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists code text,
  add column if not exists minimum_order_qty numeric,
  add column if not exists applications jsonb not null default '[]'::jsonb,
  add column if not exists is_quote_only boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_by_user_id uuid references public.users(id) on delete set null,
  status text not null default 'Recibido'
    check (status in ('Recibido', 'En revisión', 'En preparación', 'Enviado', 'Completado', 'Cancelado')),
  order_type text not null default 'quote'
    check (order_type in ('quote', 'draft', 'repeat')),
  reference_number text unique,
  subtotal numeric,
  currency text not null default 'MXN',
  notes text,
  payment_method_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_snapshot_name text not null,
  product_snapshot_code text,
  quantity numeric not null,
  unit text not null default 'kg',
  unit_price_snapshot numeric,
  line_total numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  last_message_at timestamptz,
  bonny_enabled boolean not null default true,
  created_by_user_id uuid references public.users(id) on delete set null,
  assigned_admin_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null
    check (sender_type in ('customer', 'support', 'bonny')),
  sender_user_id uuid references public.users(id) on delete set null,
  body text not null,
  attachment_url text,
  message_kind text not null default 'message'
    check (message_kind in ('message', 'attachment', 'system')),
  is_internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  requested_qty numeric,
  application_use_case text,
  target_color text,
  status text not null default 'open'
    check (status in ('open', 'quoted', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_code on public.products(code);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_conversations_customer on public.conversations(customer_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);

insert into public.categories (slug, name, description, accent_color, sort_order)
values
  ('pigmentos', 'Pigmentos', 'Color directo para formulaciones plasticas.', '#ffbe21', 10),
  ('masterbatch', 'Masterbatch', 'Masterbatch de color y funcional.', '#1439ab', 20),
  ('aditivos', 'Aditivos', 'Aditivos para mejorar desempeno de proceso.', '#18bcff', 30),
  ('desmoldantes', 'Desmoldantes', 'Soluciones para liberar pieza y proteger moldes.', '#ea148c', 40),
  ('purgas', 'Purgas', 'Limpieza tecnica para cambios de corrida.', '#0b2b86', 50),
  ('productos-especiales', 'Productos especiales', 'Linea complementaria para necesidades no estandar.', '#141c33', 60)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  accent_color = excluded.accent_color,
  sort_order = excluded.sort_order;
