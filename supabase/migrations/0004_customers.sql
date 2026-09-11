-- ============================================================
-- 0004 · Clientes (CRM básico, spec §9)
-- ============================================================

create table public.customers (
  id               uuid primary key default gen_random_uuid(),
  complex_id       uuid not null references public.complexes (id) on delete cascade,
  auth_user_id     uuid references public.user_profiles (id) on delete set null, -- NULL = cliente invitado / histórico

  first_name       text not null check (length(trim(first_name)) > 0),
  last_name        text,
  email            extensions.citext,
  phone            text,
  birth_date       date,
  notes            text,
  status           public.customer_status not null default 'active',

  -- columnas derivadas para dedupe de históricos (spec §19)
  name_normalized  text generated always as (
                     public.fn_normalize_text(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
                   ) stored,
  phone_normalized text generated always as (public.fn_normalize_phone(phone)) stored,

  -- trazabilidad de importación Excel (spec §18/§19)
  import_job_id    uuid,                            -- FK se agrega en 0008
  imported_at      timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Un auth user = un customer por complejo
create unique index uq_customers_complex_auth on public.customers (complex_id, auth_user_id) where auth_user_id is not null;
create unique index uq_customers_complex_email on public.customers (complex_id, email) where email is not null;
create unique index uq_customers_complex_phone on public.customers (complex_id, phone_normalized) where phone_normalized is not null;

create index idx_customers_complex      on public.customers (complex_id);
create index idx_customers_name_trgm    on public.customers using gin (name_normalized extensions.gin_trgm_ops);
create index idx_customers_name_norm    on public.customers (complex_id, name_normalized);

create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.fn_set_updated_at();

-- ¿El auth user actual es el dueño de esta fila de cliente?
create or replace function public.fn_is_own_customer(p_customer_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.auth_user_id = auth.uid()
  )
$$;

alter table public.customers enable row level security;
