-- ============================================================
-- 0010 · Vistas analíticas, funciones de reporte y Realtime
-- (spec §14–§16, §21) — todo security_invoker: RLS sigue aplicando
-- ============================================================

-- ---------- Detalle de reservas (calendario admin / listas) ----------
create view public.v_reservations_detail with (security_invoker = true) as
select
  r.id,
  r.complex_id,
  r.court_id,
  ct.name                                  as court_name,
  r.customer_id,
  trim(cu.first_name || ' ' || coalesce(cu.last_name, '')) as customer_name,
  cu.email                                 as customer_email,
  cu.phone                                 as customer_phone,
  r.kind,
  r.status,
  r.starts_at,
  r.ends_at,
  r.price,
  r.currency,
  r.deposit_amount,
  r.paid_amount,
  r.channel,
  r.series_id,
  r.title,
  r.notes,
  r.created_at,
  exists (
    select 1 from public.payments p
    where p.reservation_id = r.id and p.status = 'approved'
  )                                        as has_approved_payment
from public.reservations r
join public.courts ct on ct.id = r.court_id
left join public.customers cu on cu.id = r.customer_id;

-- ---------- Ficha del cliente (spec §9) ----------
create view public.v_customer_stats with (security_invoker = true) as
select
  c.id                as customer_id,
  c.complex_id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.birth_date,
  c.status,
  c.notes,
  c.created_at,
  coalesce(rs.reservations_count, 0)::bigint as reservations_count,
  rs.last_reservation_at,
  coalesce(rs.cancellations_count, 0)::bigint as cancellations_count,
  coalesce(rs.no_shows_count, 0)::bigint     as no_shows_count,
  coalesce(ps.total_spent, 0)::numeric(14,2) as total_spent,
  fav.favorite_court_id,
  fav.favorite_court_name,
  fh.favorite_hour
from public.customers c
left join lateral (
  select
    count(*) filter (where r.status in ('confirmed', 'completed'))            as reservations_count,
    count(*) filter (where r.status = 'cancelled')                            as cancellations_count,
    count(*) filter (where r.status = 'no_show')                              as no_shows_count,
    max(r.starts_at) filter (where r.status in ('confirmed', 'completed'))    as last_reservation_at
  from public.reservations r
  where r.customer_id = c.id
) rs on true
left join lateral (
  select coalesce(sum(p.amount), 0) as total_spent
  from public.payments p
  where p.customer_id = c.id
    and p.status = 'approved'
    and p.concept <> 'refund'
) ps on true
left join lateral (
  select r2.court_id as favorite_court_id, ct2.name as favorite_court_name
  from public.reservations r2
  join public.courts ct2 on ct2.id = r2.court_id
  where r2.customer_id = c.id and r2.status in ('confirmed', 'completed')
  group by r2.court_id, ct2.name
  order by count(*) desc
  limit 1
) fav on true
left join lateral (
  select extract(hour from r3.starts_at at time zone cx.timezone)::smallint as favorite_hour
  from public.reservations r3
  join public.complexes cx on cx.id = r3.complex_id
  where r3.customer_id = c.id and r3.status in ('confirmed', 'completed')
  group by 1
  order by count(*) desc
  limit 1
) fh on true;

-- ---------- Slots disponibles por cancha y día (flujo público de reserva) ----------
create or replace function public.fn_available_slots(p_court_id uuid, p_date date)
returns table (
  starts_at      timestamptz,
  ends_at        timestamptz,
  is_available   boolean,
  reservation_id uuid
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_court  public.courts;
  v_tz     text;
  v_slot   smallint;
  v_hours  public.operating_hours;
begin
  select * into v_court from public.courts where id = p_court_id;
  if not found then
    raise exception 'COURT_NOT_FOUND' using errcode = 'P0002';
  end if;

  select cx.timezone, cs.slot_duration_minutes
    into v_tz, v_slot
  from public.complexes cx
  join public.complex_settings cs on cs.complex_id = cx.id
  where cx.id = v_court.complex_id;

  select * into v_hours
  from public.operating_hours oh
  where oh.complex_id = v_court.complex_id
    and oh.day_of_week = extract(dow from p_date)::smallint
    and (oh.court_id = p_court_id or oh.court_id is null)
  order by (oh.court_id is not null) desc
  limit 1;

  if v_hours is null or v_hours.is_closed then
    return;
  end if;

  return query
  with slots as (
    select generate_series(
      (p_date::text || ' ' || v_hours.opens_at::text)::timestamp,
      (p_date::text || ' ' || v_hours.closes_at::text)::timestamp - make_interval(mins => v_slot),
      make_interval(mins => v_slot)
    ) as local_start
  )
  select
    s.local_start at time zone v_tz                                       as starts_at,
    (s.local_start + make_interval(mins => v_slot)) at time zone v_tz     as ends_at,
    (rl.id is null)
      and (s.local_start at time zone v_tz) > now()                       as is_available,
    rl.id                                                                 as reservation_id
  from slots s
  left join lateral (
    select rr.id
    from public.reservations rr
    where rr.court_id = p_court_id
      and rr.status in ('pending', 'confirmed', 'completed', 'no_show')
      and tstzrange(rr.starts_at, rr.ends_at)
          && tstzrange(s.local_start at time zone v_tz,
                       (s.local_start + make_interval(mins => v_slot)) at time zone v_tz)
    limit 1
  ) rl on true
  order by 1;
end;
$$;

-- ---------- KPIs del complejo en un rango (dashboard §14, reportes §15) ----------
create or replace function public.fn_complex_kpis(
  p_complex_id uuid,
  p_from       date,
  p_to         date
)
returns table (
  total_reservations bigint,
  confirmed          bigint,
  cancelled          bigint,
  no_shows           bigint,
  revenue            numeric(14, 2),
  occupancy_pct      numeric(5, 2)
)
language sql
stable
set search_path = public
as $$
  with tz as (
    select c.timezone from public.complexes c where c.id = p_complex_id
  ),
  res as (
    select
      count(*) filter (where r.status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) as total_reservations,
      count(*) filter (where r.status in ('confirmed', 'completed')) as confirmed,
      count(*) filter (where r.status = 'cancelled')                 as cancelled,
      count(*) filter (where r.status = 'no_show')                   as no_shows
    from public.reservations r cross join tz
    where r.complex_id = p_complex_id
      and r.kind = 'booking'
      and (r.starts_at at time zone tz.timezone)::date between p_from and p_to
  ),
  pay as (
    select coalesce(sum(case when p.concept = 'refund' then -p.amount else p.amount end), 0) as revenue
    from public.payments p cross join tz
    where p.complex_id = p_complex_id
      and p.status = 'approved'
      and (p.created_at at time zone tz.timezone)::date between p_from and p_to
  ),
  booked as (
    select coalesce(sum(extract(epoch from (r.ends_at - r.starts_at)) / 60.0), 0) as minutes
    from public.reservations r cross join tz
    where r.complex_id = p_complex_id
      and r.status in ('confirmed', 'completed')
      and (r.starts_at at time zone tz.timezone)::date between p_from and p_to
  ),
  avail as (
    select coalesce(sum(extract(epoch from coalesce(
             (select oh.closes_at - oh.opens_at from public.operating_hours oh
               where oh.complex_id = p_complex_id and oh.court_id = ct.id
                 and oh.day_of_week = extract(dow from d.day)::smallint and not oh.is_closed
               limit 1),
             (select oh.closes_at - oh.opens_at from public.operating_hours oh
               where oh.complex_id = p_complex_id and oh.court_id is null
                 and oh.day_of_week = extract(dow from d.day)::smallint and not oh.is_closed
               limit 1),
             interval '0'
           )) / 60.0), 0) as minutes
    from public.courts ct
    cross join (select generate_series(p_from::timestamp, p_to::timestamp, interval '1 day')::date as day) d
    where ct.complex_id = p_complex_id and ct.status = 'active'
  )
  select
    res.total_reservations,
    res.confirmed,
    res.cancelled,
    res.no_shows,
    pay.revenue::numeric(14, 2),
    case when avail.minutes > 0
         then round((booked.minutes / avail.minutes * 100)::numeric, 2)
         else 0
    end
  from res, pay, booked, avail
$$;

-- ---------- Ocupación / ingresos por cancha (spec §16) ----------
create or replace function public.fn_occupancy_by_court(
  p_complex_id uuid,
  p_from       date,
  p_to         date
)
returns table (
  court_id            uuid,
  court_name          text,
  reservations_count  bigint,
  revenue             numeric(14, 2),
  occupancy_pct       numeric(5, 2),
  avg_booking_value   numeric(14, 2)
)
language sql
stable
set search_path = public
as $$
  with tz as (
    select c.timezone from public.complexes c where c.id = p_complex_id
  ),
  days as (
    select generate_series(p_from::timestamp, p_to::timestamp, interval '1 day')::date as day
  ),
  avail as (
    select
      ct.id   as court_id,
      ct.name as court_name,
      coalesce(sum(extract(epoch from coalesce(
        (select oh.closes_at - oh.opens_at from public.operating_hours oh
          where oh.complex_id = p_complex_id and oh.court_id = ct.id
            and oh.day_of_week = extract(dow from d.day)::smallint and not oh.is_closed
          limit 1),
        (select oh.closes_at - oh.opens_at from public.operating_hours oh
          where oh.complex_id = p_complex_id and oh.court_id is null
            and oh.day_of_week = extract(dow from d.day)::smallint and not oh.is_closed
          limit 1),
        interval '0'
      )) / 60.0), 0) as minutes
    from public.courts ct cross join days d
    where ct.complex_id = p_complex_id and ct.status = 'active'
    group by ct.id, ct.name
  ),
  booked as (
    select
      r.court_id,
      count(*)                                              as cnt,
      sum(extract(epoch from (r.ends_at - r.starts_at)) / 60.0) as minutes,
      sum(r.price)                                          as revenue
    from public.reservations r cross join tz
    where r.complex_id = p_complex_id
      and r.status in ('confirmed', 'completed')
      and r.kind = 'booking'
      and (r.starts_at at time zone tz.timezone)::date between p_from and p_to
    group by r.court_id
  )
  select
    a.court_id,
    a.court_name,
    coalesce(b.cnt, 0)::bigint,
    coalesce(b.revenue, 0)::numeric(14, 2),
    case when a.minutes > 0
         then round((coalesce(b.minutes, 0) / a.minutes * 100)::numeric, 2)
         else 0
    end,
    case when coalesce(b.cnt, 0) > 0
         then round((b.revenue / b.cnt)::numeric, 2)
         else 0
    end
  from avail a
  left join booked b on b.court_id = a.court_id
  order by a.court_name
$$;

-- ---------- Comparativa de períodos (spec §22: 2024 vs 2025) ----------
create or replace function public.fn_compare_periods(
  p_complex_id uuid,
  p_from_a     date, p_to_a date,
  p_from_b     date, p_to_b date
)
returns table (
  metric              text,
  value_a             numeric(14, 2),
  value_b             numeric(14, 2),
  delta_abs           numeric(14, 2),
  delta_pct           numeric(8, 2)
)
language sql
stable
set search_path = public
as $$
  with a as (select * from public.fn_complex_kpis(p_complex_id, p_from_a, p_to_a)),
       b as (select * from public.fn_complex_kpis(p_complex_id, p_from_b, p_to_b))
  select
    m.metric,
    m.value_a,
    m.value_b,
    (m.value_b - m.value_a)::numeric(14, 2),
    case when m.value_a <> 0
         then round(((m.value_b - m.value_a) / m.value_a * 100)::numeric, 2)
         else null
    end
  from a, b,
  lateral (values
    ('reservas',     a.total_reservations::numeric, b.total_reservations::numeric),
    ('confirmadas',  a.confirmed::numeric,          b.confirmed::numeric),
    ('canceladas',   a.cancelled::numeric,          b.cancelled::numeric),
    ('no_shows',     a.no_shows::numeric,           b.no_shows::numeric),
    ('ingresos',     a.revenue::numeric,            b.revenue::numeric),
    ('ocupacion_%',  a.occupancy_pct::numeric,      b.occupancy_pct::numeric)
  ) as m(metric, value_a, value_b)
$$;

-- ---------- Realtime (spec §11: la grilla se actualiza sola) ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.reservations';
    exception when duplicate_object then null;
    end;
    begin
      execute 'alter publication supabase_realtime add table public.payments';
    exception when duplicate_object then null;
    end;
    begin
      execute 'alter publication supabase_realtime add table public.notifications';
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
