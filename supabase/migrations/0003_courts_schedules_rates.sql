-- ============================================================
-- 0003 · Canchas, horarios de operación, tarifas y promociones
-- ============================================================

-- ---------- Canchas ----------
create table public.courts (
  id            uuid primary key default gen_random_uuid(),
  complex_id    uuid not null references public.complexes (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  description   text,
  surface       text,                              -- 'césped sintético', 'cristal', etc.
  is_indoor     boolean not null default false,
  has_lighting  boolean not null default true,
  position      smallint,                          -- orden de visualización en la grilla
  status        public.court_status not null default 'active',
  image_url     text,
  is_public     boolean not null default true,     -- visible en sitio público / reservable online
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (complex_id, name)
);

create index idx_courts_complex on public.courts (complex_id) where status = 'active';

create trigger trg_courts_updated
  before update on public.courts
  for each row execute function public.fn_set_updated_at();

-- ---------- Horarios de operación ----------
-- court_id NULL = horario default del complejo; con court_id = override por cancha.
-- day_of_week: 0 = domingo … 6 = sábado (extract(dow)).
create table public.operating_hours (
  id          uuid primary key default gen_random_uuid(),
  complex_id  uuid not null references public.complexes (id) on delete cascade,
  court_id    uuid references public.courts (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (closes_at > opens_at),
  unique (complex_id, court_id, day_of_week)
);

-- NULLs distintos no chocan en UNIQUE; índice parcial para el default del complejo:
create unique index uq_operating_hours_complex_day
  on public.operating_hours (complex_id, day_of_week)
  where court_id is null;

create index idx_operating_hours_complex on public.operating_hours (complex_id);

create trigger trg_operating_hours_updated
  before update on public.operating_hours
  for each row execute function public.fn_set_updated_at();

-- ---------- Reglas de tarifa ----------
-- Precio por cancha (o todo el complejo), día de semana (o todos) y franja horaria.
-- La resolución elige la regla más específica vigente (ver fn_resolve_price).
create table public.rate_rules (
  id          uuid primary key default gen_random_uuid(),
  complex_id  uuid not null references public.complexes (id) on delete cascade,
  court_id    uuid references public.courts (id) on delete cascade,   -- NULL = todas
  name        text,                                                   -- ej: "Noche semana", "Finde"
  day_of_week smallint check (day_of_week between 0 and 6),           -- NULL = todos
  starts_from time,                                                   -- NULL = desde apertura
  ends_to     time,                                                   -- NULL = hasta cierre
  price       numeric(14, 2) not null check (price >= 0),
  currency    char(3) not null default 'ARS',
  valid_from  date not null default current_date,
  valid_to    date,                                                   -- NULL = sin fin
  is_active   boolean not null default true,
  priority    smallint not null default 0,                            -- desempate: mayor gana
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (starts_from is null or ends_to is null or ends_to > starts_from),
  check (valid_to is null or valid_to >= valid_from)
);

create index idx_rate_rules_lookup
  on public.rate_rules (complex_id, court_id, day_of_week)
  where is_active;

create trigger trg_rate_rules_updated
  before update on public.rate_rules
  for each row execute function public.fn_set_updated_at();

-- Resuelve el precio de un turno: reglas de cancha > complejo; día específico > todos;
-- franja más acotada > amplia; desempate por priority y created_at.
create or replace function public.fn_resolve_price(
  p_complex_id uuid,
  p_court_id   uuid,
  p_starts_at  timestamptz
)
returns numeric(14, 2)
language sql
stable
set search_path = public
as $$
  with candidates as (
    select r.*,
           (r.court_id is not null)::int * 4
         + (r.day_of_week is not null)::int * 2
         + (r.starts_from is not null)::int as specificity
    from public.rate_rules r
    where r.complex_id = p_complex_id
      and r.is_active
      and (r.court_id is null or r.court_id = p_court_id)
      and (r.day_of_week is null or r.day_of_week = extract(dow from p_starts_at at time zone
            coalesce((select timezone from public.complexes where id = p_complex_id), 'UTC')))
      and (r.starts_from is null or (p_starts_at at time zone
            coalesce((select timezone from public.complexes where id = p_complex_id), 'UTC'))::time >= r.starts_from)
      and (r.ends_to is null or (p_starts_at at time zone
            coalesce((select timezone from public.complexes where id = p_complex_id), 'UTC'))::time < r.ends_to)
      and (p_starts_at at time zone
            coalesce((select timezone from public.complexes where id = p_complex_id), 'UTC'))::date
            between r.valid_from and coalesce(r.valid_to, 'infinity'::date)
  )
  select c.price
  from candidates c
  order by c.specificity desc, c.priority desc, c.created_at desc
  limit 1
$$;

-- ---------- Promociones (spec §5 / §36) ----------
create table public.promotions (
  id             uuid primary key default gen_random_uuid(),
  complex_id     uuid not null references public.complexes (id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  description    text,
  discount_type  public.discount_type not null,
  discount_value numeric(14, 2) check (discount_value >= 0),
  applies_days   smallint[],                        -- ej: {1,2,3} lun/mar/mié; NULL = todos
  applies_from   time,                              -- franja horaria; NULL = todo el día
  applies_to     time,
  valid_from     date not null default current_date,
  valid_to       date,
  max_uses       integer,                           -- NULL = ilimitado
  used_count     integer not null default 0,
  is_active      boolean not null default true,
  is_public      boolean not null default true,     -- visible en landing (si publish_promotions)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (discount_type not in ('percent', 'fixed') or discount_value is not null),
  check (applies_to is null or applies_from is null or applies_to > applies_from)
);

create index idx_promotions_complex on public.promotions (complex_id) where is_active;

create trigger trg_promotions_updated
  before update on public.promotions
  for each row execute function public.fn_set_updated_at();

-- ---------- RLS habilitado (políticas en 0009) ----------
alter table public.courts          enable row level security;
alter table public.operating_hours enable row level security;
alter table public.rate_rules      enable row level security;
alter table public.promotions      enable row level security;
