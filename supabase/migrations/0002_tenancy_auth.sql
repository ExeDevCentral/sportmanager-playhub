-- ============================================================
-- 0002 · Tenancy y autenticación
-- user_profiles · complexes · complex_settings · complex_members
-- ============================================================

create type public.deposit_mode as enum ('none', 'percent', 'fixed');

-- ---------- Perfiles (extensión de auth.users) ----------
create table public.user_profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  platform_role  public.platform_role not null default 'user',
  first_name     text,
  last_name      text,
  email          extensions.citext,
  phone          text,
  avatar_url     text,
  locale         text not null default 'es-AR',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_user_profiles_updated
  before update on public.user_profiles
  for each row execute function public.fn_set_updated_at();

-- Creación automática de perfil al registrarse en Supabase Auth
create or replace function public.fn_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, first_name, last_name, avatar_url, phone)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'given_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_auth_user();

-- ---------- Complejos (tenant raíz) ----------
create table public.complexes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(trim(name)) > 0),
  slug                text not null unique,           -- URL pública: /[complexSlug]
  status              public.complex_status not null default 'active',
  timezone            text not null default 'America/Argentina/Buenos_Aires',
  currency            char(3) not null default 'ARS',
  email               extensions.citext,
  phone               text,
  address             text,
  city                text,
  province            text,
  country             text not null default 'AR',
  description         text,
  logo_url            text,
  cover_url           text,
  public_site_enabled boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_complexes_updated
  before update on public.complexes
  for each row execute function public.fn_set_updated_at();

-- ---------- Configuración operativa (1:1 con complex) ----------
create table public.complex_settings (
  complex_id                  uuid primary key references public.complexes (id) on delete cascade,

  -- slots y ventana de reserva
  slot_duration_minutes       smallint not null default 90 check (slot_duration_minutes in (30, 45, 60, 90, 120)),
  max_advance_days            smallint not null default 60,   -- días hacia adelante reservables
  min_advance_minutes         integer  not null default 60,   -- antelación mínima antes del turno
  hold_minutes                smallint not null default 15,   -- TTL de una reserva pending sin pago

  -- política de cancelación (spec §1/§10)
  cancellation_deadline_hours smallint not null default 24,   -- 0 = sin restricción
  allow_customer_cancellation boolean not null default true,

  -- seña / pago (spec §28)
  require_online_payment      boolean not null default true,
  deposit_mode                public.deposit_mode not null default 'none',
  deposit_percent             smallint check (deposit_percent between 0 and 100),
  deposit_fixed               numeric(14, 2) check (deposit_fixed >= 0),
  allow_guest_booking         boolean not null default true,

  -- recordatorios (spec §30)
  reminder_24h_enabled        boolean not null default true,
  reminder_2h_enabled         boolean not null default true,

  -- publicación de estadísticas (spec §23)
  publish_stats               boolean not null default false,
  publish_occupancy           boolean not null default false,
  publish_reservations_count  boolean not null default false,
  publish_court_stats         boolean not null default false,
  publish_history             boolean not null default false,
  publish_promotions          boolean not null default true,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  check (deposit_mode <> 'percent' or deposit_percent is not null),
  check (deposit_mode <> 'fixed'   or deposit_fixed   is not null)
);

create trigger trg_complex_settings_updated
  before update on public.complex_settings
  for each row execute function public.fn_set_updated_at();

-- Settings por defecto al crear un complejo
create or replace function public.fn_handle_new_complex()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.complex_settings (complex_id)
  values (new.id)
  on conflict (complex_id) do nothing;
  return new;
end;
$$;

create trigger trg_on_complex_created
  after insert on public.complexes
  for each row execute function public.fn_handle_new_complex();

-- ---------- Membresías / RBAC por complejo (spec §8) ----------
-- Un usuario puede tener roles distintos en complejos distintos.
create table public.complex_members (
  id          uuid primary key default gen_random_uuid(),
  complex_id  uuid not null references public.complexes (id) on delete cascade,
  user_id     uuid not null references public.user_profiles (id) on delete cascade,
  role        public.complex_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (complex_id, user_id)
);

create index idx_complex_members_user on public.complex_members (user_id) where is_active;

create trigger trg_complex_members_updated
  before update on public.complex_members
  for each row execute function public.fn_set_updated_at();

-- ---------- Helpers RLS (SECURITY DEFINER para no recursar sobre complex_members) ----------

create or replace function public.fn_is_platform_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and platform_role = 'platform_admin'
  )
$$;

create or replace function public.fn_complex_role(p_complex_id uuid)
returns public.complex_role
language sql
stable security definer
set search_path = public
as $$
  select m.role
  from public.complex_members m
  where m.complex_id = p_complex_id
    and m.user_id = auth.uid()
    and m.is_active
$$;

create or replace function public.fn_role_rank(p_role public.complex_role)
returns int
language sql
immutable
as $$
  select case p_role
    when 'complex_owner'  then 3
    when 'complex_admin'  then 2
    when 'staff'          then 1
    else 0
  end
$$;

-- ¿El usuario actual tiene al menos el rol indicado en el complejo?
create or replace function public.fn_has_complex_role(p_complex_id uuid, p_min_role public.complex_role)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select public.fn_is_platform_admin()
      or coalesce(public.fn_role_rank(public.fn_complex_role(p_complex_id)), 0)
         >= public.fn_role_rank(p_min_role)
$$;

-- ¿El usuario actual es miembro (cualquier rol) del complejo?
create or replace function public.fn_is_complex_member(p_complex_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select public.fn_is_platform_admin()
      or exists (
        select 1 from public.complex_members m
        where m.complex_id = p_complex_id
          and m.user_id = auth.uid()
          and m.is_active
      )
$$;

-- ---------- RLS habilitado (las políticas viven en 0009) ----------
alter table public.user_profiles     enable row level security;
alter table public.complexes         enable row level security;
alter table public.complex_settings  enable row level security;
alter table public.complex_members   enable row level security;
