-- ============================================================
-- 0005 · Reservas (spec §10–§13) — núcleo anti doble-booking
-- reservation_series · reservations · create_reservation · holds
-- ============================================================

-- ---------- Series recurrentes ("todos los martes 20hs", spec §12) ----------
create table public.reservation_series (
  id             uuid primary key default gen_random_uuid(),
  complex_id     uuid not null references public.complexes (id) on delete cascade,
  court_id       uuid not null references public.courts (id) on delete cascade,
  customer_id    uuid not null references public.customers (id) on delete restrict,
  created_by     uuid references public.user_profiles (id) on delete set null, -- NULL = creada por el cliente

  day_of_week    smallint not null check (day_of_week between 0 and 6),        -- 0 = domingo
  start_time     time not null,
  duration_minutes smallint not null default 90 check (duration_minutes > 0),
  valid_from     date not null,
  valid_until    date not null,

  status         public.reservation_series_status not null default 'active',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (valid_until >= valid_from)
);

create index idx_reservation_series_complex on public.reservation_series (complex_id) where status = 'active';
create index idx_reservation_series_customer on public.reservation_series (customer_id);

create trigger trg_reservation_series_updated
  before update on public.reservation_series
  for each row execute function public.fn_set_updated_at();

-- ---------- Reservas ----------
-- kind: booking (turno de cliente) | block (bloqueo manual) | maintenance | event
create table public.reservations (
  id               uuid primary key default gen_random_uuid(),
  complex_id       uuid not null references public.complexes (id) on delete cascade,
  court_id         uuid not null references public.courts (id) on delete restrict,
  customer_id      uuid references public.customers (id) on delete set null,   -- NULL en blocks/mantenimiento
  series_id        uuid references public.reservation_series (id) on delete set null,
  occurrence_index smallint,                                                   -- posición dentro de la serie
  created_by       uuid references public.user_profiles (id) on delete set null,
  channel          text not null default 'online' check (channel in ('online', 'admin', 'phone', 'import', 'series')),

  kind             public.reservation_kind not null default 'booking',
  status           public.reservation_status not null default 'pending',

  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  price            numeric(14, 2) not null default 0 check (price >= 0),
  currency         char(3) not null default 'ARS',
  deposit_amount   numeric(14, 2) not null default 0 check (deposit_amount >= 0),
  paid_amount      numeric(14, 2) not null default 0 check (paid_amount >= 0),
  promotion_id     uuid references public.promotions (id) on delete set null,

  title            text,                                                       -- blocks/eventos
  notes            text,
  expires_at       timestamptz,                                                -- TTL del hold pending (NULL = sin TTL)

  cancelled_at     timestamptz,
  cancelled_by     uuid,
  cancel_reason    text,

  -- trazabilidad de importación Excel
  import_job_id    uuid,                                                       -- FK en 0008
  import_row_id    uuid,                                                       -- FK en 0008

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  check (ends_at > starts_at),
  check (deposit_amount <= price),
  check (kind <> 'booking' or customer_id is not null)
);

-- ★ PROTECCIÓN REAL CONTRA DOBLE RESERVA (spec §11) ★
-- Dos filas activas no pueden solaparse en la misma cancha. cancelled/expired/refunded liberan el rango.
alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    court_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed', 'completed', 'no_show'));

create index idx_reservations_complex_range on public.reservations (complex_id, starts_at desc);
create index idx_reservations_court_range   on public.reservations (court_id, starts_at);
create index idx_reservations_customer      on public.reservations (customer_id) where customer_id is not null;
create index idx_reservations_status        on public.reservations (complex_id, status);
create index idx_reservations_series        on public.reservations (series_id) where series_id is not null;
create index idx_reservations_pending_exp   on public.reservations (expires_at) where status = 'pending';

create trigger trg_reservations_updated
  before update on public.reservations
  for each row execute function public.fn_set_updated_at();

-- ---------- Creación atómica de reserva (single source of truth) ----------
-- SECURITY DEFINER: valida negocio, calcula precio/depósito/hold y deja que el
-- EXCLUDE constraint sea la última línea de defensa contra race conditions.
create or replace function public.fn_create_reservation(
  p_court_id       uuid,
  p_starts_at      timestamptz,
  p_ends_at        timestamptz     default null,   -- NULL = usar slot_duration_minutes
  p_customer_id    uuid            default null,
  p_kind           public.reservation_kind default 'booking',
  p_price          numeric(14, 2)  default null,   -- NULL = resolver con rate_rules
  p_channel        text            default 'online',
  p_created_by     uuid            default null,
  p_title          text            default null,
  p_notes          text            default null,
  p_hold           boolean         default true    -- false = pending sin TTL (reserva admin/telefónica)
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court      public.courts;
  v_settings   public.complex_settings;
  v_tz         text;
  v_currency   char(3);
  v_local      timestamp;
  v_local_end  timestamp;
  v_ends_at    timestamptz;
  v_price      numeric(14, 2);
  v_deposit    numeric(14, 2) := 0;
  v_expires_at timestamptz;
  v_hours      public.operating_hours;
  v_result     public.reservations;
begin
  select * into v_court from public.courts where id = p_court_id for update;
  if not found then
    raise exception 'COURT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_court.status <> 'active' then
    raise exception 'COURT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select * into v_settings from public.complex_settings where complex_id = v_court.complex_id;
  select timezone, currency into v_tz, v_currency from public.complexes where id = v_court.complex_id;

  v_ends_at   := coalesce(p_ends_at, p_starts_at + make_interval(mins => v_settings.slot_duration_minutes));
  if v_ends_at <= p_starts_at then
    raise exception 'INVALID_TIME_RANGE' using errcode = 'P0001';
  end if;

  v_local     := (p_starts_at at time zone v_tz)::timestamp;
  v_local_end := (v_ends_at at time zone v_tz)::timestamp;

  -- Validaciones de ventana de reserva (solo para canal online)
  if p_channel = 'online' then
    if p_starts_at < now() + make_interval(mins => v_settings.min_advance_minutes) then
      raise exception 'TOO_LATE_TO_BOOK' using errcode = 'P0001';
    end if;
    if p_starts_at > now() + make_interval(days => v_settings.max_advance_days) then
      raise exception 'TOO_FAR_TO_BOOK' using errcode = 'P0001';
    end if;
  end if;

  -- Validación de horario de operación: override de cancha > default del complejo
  select * into v_hours
  from public.operating_hours
  where complex_id = v_court.complex_id
    and day_of_week = extract(dow from v_local)::smallint
    and (court_id = p_court_id or court_id is null)
  order by (court_id is not null) desc
  limit 1;

  if v_hours is null or v_hours.is_closed then
    raise exception 'OUTSIDE_OPERATING_HOURS' using errcode = 'P0001';
  end if;
  if v_local::time < v_hours.opens_at
     or v_local_end::date > v_local::date                 -- no se admite cruzar medianoche
     or v_local_end::time > v_hours.closes_at then
    raise exception 'OUTSIDE_OPERATING_HOURS' using errcode = 'P0001';
  end if;

  -- Precio y seña
  v_price := coalesce(p_price, public.fn_resolve_price(v_court.complex_id, p_court_id, p_starts_at), 0);
  v_deposit := case v_settings.deposit_mode
    when 'percent' then round(v_price * v_settings.deposit_percent / 100.0, 2)
    when 'fixed'   then least(v_settings.deposit_fixed, v_price)
    else 0
  end;

  -- Hold temporal para reservas online pendientes de pago
  if p_hold and p_kind = 'booking' and v_settings.require_online_payment and p_channel = 'online' then
    v_expires_at := now() + make_interval(mins => v_settings.hold_minutes);
  end if;

  begin
    insert into public.reservations (
      complex_id, court_id, customer_id, created_by, channel, kind, status,
      starts_at, ends_at, price, currency, deposit_amount, title, notes, expires_at
    )
    values (
      v_court.complex_id, p_court_id, p_customer_id, coalesce(p_created_by, auth.uid()), p_channel, p_kind,
      case when p_kind = 'booking' and v_settings.require_online_payment and p_channel = 'online'
           then 'pending'::public.reservation_status
           else 'confirmed'::public.reservation_status end,
      p_starts_at, v_ends_at, v_price, v_currency,
      v_deposit, p_title, p_notes, v_expires_at
    )
    returning * into v_result;
  exception
    when exclusion_violation then
      -- SQLSTATE 23P01 → conflicto de solapamiento: el turno ya fue tomado
      raise exception 'RESERVATION_CONFLICT' using errcode = '23P01';
  end;

  return v_result;
end;
$$;

-- ---------- Expiración de holds pendientes (llamar desde pg_cron cada minuto) ----------
create or replace function public.fn_expire_reservation_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.reservations
     set status = 'expired'
   where status = 'pending'
     and expires_at is not null
     and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Habilitar pg_cron en Supabase y ejecutar:
-- select cron.schedule('expire-reservation-holds', '* * * * *',
--   $$select public.fn_expire_reservation_holds()$$);

-- ---------- Cancelación con política de tiempo límite (spec §1) ----------
create or replace function public.fn_cancel_reservation(
  p_reservation_id uuid,
  p_reason         text default null,
  p_by_customer    boolean default false
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res       public.reservations;
  v_deadline  smallint;
begin
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'RESERVATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_res.status in ('cancelled', 'expired', 'refunded') then
    raise exception 'RESERVATION_ALREADY_CLOSED' using errcode = 'P0001';
  end if;

  if p_by_customer then
    select cancellation_deadline_hours into v_deadline
    from public.complex_settings where complex_id = v_res.complex_id;
    if v_deadline > 0 and v_res.starts_at < now() + make_interval(hours => v_deadline) then
      raise exception 'CANCELLATION_DEADLINE_PASSED' using errcode = 'P0001';
    end if;
  end if;

  update public.reservations
     set status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = auth.uid(),
         cancel_reason = p_reason
   where id = p_reservation_id
   returning * into v_res;

  return v_res;
end;
$$;

-- ---------- Generación de ocurrencias de una serie recurrente ----------
-- Inserta los turnos futuros; los que chocan quedan registrados en p_conflicts (spec §12).
create or replace function public.fn_generate_series_occurrences(
  p_series_id uuid,
  p_from      date default current_date,
  p_to        date default null
)
returns table (starts_at timestamptz, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series   public.reservation_series;
  v_tz       text;
  v_date     date;
  v_limit    date;
  v_start    timestamptz;
  v_end      timestamptz;
  v_index    smallint;
  v_conflict boolean;
begin
  select * into v_series from public.reservation_series where id = p_series_id for update;
  if not found then
    raise exception 'SERIES_NOT_FOUND' using errcode = 'P0002';
  end if;
  select timezone into v_tz from public.complexes where id = v_series.complex_id;

  v_limit := least(coalesce(p_to, v_series.valid_until), v_series.valid_until);
  -- primera fecha >= greatest(p_from, valid_from) que cae en el día de la semana
  v_date := greatest(p_from, v_series.valid_from);
  while extract(dow from v_date)::smallint <> v_series.day_of_week loop
    v_date := v_date + 1;
  end loop;

  select coalesce(max(occurrence_index), 0) into v_index
  from public.reservations where series_id = p_series_id;

  while v_date <= v_limit loop
    v_start := (v_date::text || ' ' || v_series.start_time::text)::timestamp at time zone v_tz;
    v_end   := v_start + make_interval(mins => v_series.duration_minutes);
    v_index := v_index + 1;

    select exists (
      select 1 from public.reservations r
      where r.court_id = v_series.court_id
        and r.status in ('pending', 'confirmed', 'completed', 'no_show')
        and tstzrange(r.starts_at, r.ends_at) && tstzrange(v_start, v_end)
    ) into v_conflict;

    if v_conflict then
      starts_at := v_start;
      created   := false;                       -- "Recurring reservation conflict"
      return next;
    else
      insert into public.reservations (
        complex_id, court_id, customer_id, series_id, occurrence_index,
        created_by, channel, kind, status, starts_at, ends_at, price, deposit_amount
      )
      values (
        v_series.complex_id, v_series.court_id, v_series.customer_id, v_series.id, v_index,
        v_series.created_by, 'series', 'booking', 'confirmed', v_start, v_end,
        coalesce(public.fn_resolve_price(v_series.complex_id, v_series.court_id, v_start), 0),
        0
      );
      starts_at := v_start;
      created   := true;
      return next;
    end if;

    v_date := v_date + 7;
  end loop;
end;
$$;

alter table public.reservations      enable row level security;
alter table public.reservation_series enable row level security;
