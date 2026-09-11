-- ============================================================
-- 0001 · Extensiones, enums y funciones utilitarias
-- Plataforma Pádel SaaS · Supabase (PostgreSQL 15+)
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists btree_gist   with schema extensions; -- EXCLUDE constraint anti doble-reserva
create extension if not exists citext       with schema extensions; -- emails case-insensitive
create extension if not exists pg_trgm      with schema extensions; -- búsqueda fuzzy / buscador global
create extension if not exists unaccent     with schema extensions; -- normalización de nombres (históricos Excel)

-- ---------- Enums ----------
create type public.platform_role as enum ('platform_admin', 'user');

create type public.complex_role as enum ('complex_owner', 'complex_admin', 'staff');

create type public.complex_status as enum ('active', 'suspended', 'archived');

create type public.customer_status as enum ('active', 'inactive', 'blocked');

create type public.reservation_status as enum
  ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'expired', 'refunded');

create type public.reservation_kind as enum
  ('booking', 'block', 'maintenance', 'event');

create type public.reservation_series_status as enum ('active', 'paused', 'cancelled');

create type public.payment_provider as enum ('mercadopago', 'manual', 'other');

create type public.payment_status as enum
  ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back');

create type public.payment_concept as enum ('deposit', 'full', 'balance', 'refund');

create type public.webhook_event_status as enum ('received', 'processed', 'failed', 'ignored');

create type public.notification_channel as enum ('email', 'whatsapp');

create type public.notification_status as enum ('queued', 'sending', 'sent', 'failed', 'skipped');

create type public.discount_type as enum ('percent', 'fixed', 'two_for_one', 'free_hours');

create type public.court_status as enum ('active', 'inactive', 'maintenance');

create type public.import_job_status as enum
  ('uploaded', 'parsed', 'mapped', 'validated', 'importing', 'completed', 'failed', 'cancelled');

create type public.import_row_status as enum
  ('pending', 'valid', 'invalid', 'imported', 'skipped');

-- ---------- Funciones utilitarias ----------

-- updated_at automático
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Diccionario unaccent invocable desde función IMMUTABLE (requerido por columnas generadas)
create text search dictionary public.unaccent_simple (
  template = extensions.unaccent,
  rules = 'unaccent'
);

create or replace function public.fn_unaccent(p_input text)
returns text
language sql
immutable parallel safe strict
set search_path = public, extensions
as $$
  select extensions.unaccent('public.unaccent_simple'::regdictionary, p_input)::text
$$;

-- Normalización de texto para dedupe de clientes: minúsculas, sin tildes, sin signos, espacios colapsados
-- "JUAN PÉREZ" / "Juan Perez" / "juan  pérez," → "juan perez"
create or replace function public.fn_normalize_text(p_input text)
returns text
language sql
immutable parallel safe strict
as $$
  select trim(
    regexp_replace(
      regexp_replace(lower(public.fn_unaccent(p_input)), '[^a-z0-9 ]', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  )
$$;

-- Normalización de teléfono: solo dígitos (la estrategia E.164 vive en la capa service)
create or replace function public.fn_normalize_phone(p_input text)
returns text
language sql
immutable parallel safe
as $$
  select nullif(regexp_replace(coalesce(p_input, ''), '\D', '', 'g'), '')
$$;
