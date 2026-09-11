\set ON_ERROR_STOP on
set timezone = 'UTC';

-- Helpers de aserción (sesión local)
create or replace function pg_temp.fail_if(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if coalesce(p_cond, true) then raise exception 'FALLO: %', p_msg; end if;
  raise notice 'OK: %', p_msg;
end $$;

create or replace function pg_temp.expect_exclusion(p_court uuid, p_start timestamptz, p_cust uuid) returns void language plpgsql as $$
begin
  perform public.fn_create_reservation(p_court, p_start, null, p_cust, 'booking', null, 'admin');
  raise exception 'FALLO: la función permitió doble reserva';
exception when exclusion_violation then
  raise notice 'OK: fn_create_reservation rechazó solapamiento → %', sqlerrm;
end $$;

create or replace function pg_temp.expect_outside_hours(p_court uuid, p_start timestamptz, p_cust uuid) returns void language plpgsql as $$
begin
  perform public.fn_create_reservation(p_court, p_start, null, p_cust, 'booking', null, 'admin');
  raise exception 'FALLO: permitió reservar fuera de horario';
exception when raise_exception then
  if sqlerrm = 'OUTSIDE_OPERATING_HOURS' then raise notice 'OK: OUTSIDE_OPERATING_HOURS rechazado';
  else raise; end if;
end $$;

create or replace function pg_temp.expect_unique(p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLO: constraint UNIQUE/EXCLUDE no actuó';
exception when unique_violation or exclusion_violation then
  raise notice 'OK: UNIQUE/EXCLUDE bloqueó (% / %)', sqlstate, sqlerrm;
end $$;

create or replace function pg_temp.expect_immutable(p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLO: se pudo modificar una fila inmutable';
exception when insufficient_privilege then
  raise notice 'OK: fila inmutable protegida (ROW_IS_IMMUTABLE)';
end $$;

-- ============ SEED ============
insert into public.complexes (name, slug) values ('Padel Test', 'padel-test') returning id \gset complex_
update public.complex_settings
   set deposit_mode = 'percent', deposit_percent = 30
 where complex_id = :'complex_id';

insert into public.complexes (name, slug) values ('Padel B', 'padel-b') returning id \gset comb_

insert into public.courts (complex_id, name) values (:'complex_id', 'Cancha 1') returning id \gset c1_
insert into public.courts (complex_id, name) values (:'complex_id', 'Cancha 2') returning id \gset c2_

insert into public.operating_hours (complex_id, court_id, day_of_week, opens_at, closes_at)
select :'complex_id', null, d, '09:00', '23:00' from generate_series(1, 6) d;

insert into public.rate_rules (complex_id, name, day_of_week, starts_from, ends_to, price) values
  (:'complex_id', 'Dia',     null, '09:00', '18:00', 10000),
  (:'complex_id', 'Noche',   null, '18:00', '23:00', 20000),
  (:'complex_id', 'Sabado',  6,    '09:00', '23:00', 25000),
  (:'complex_id', 'Domingo', 0,    '09:00', '23:00', 25000);

insert into public.customers (complex_id, first_name, last_name, email, phone)
values (:'complex_id', 'Juan', 'Pérez', 'juan@test.com', '+54 11 4444-5555') returning id \gset cust_

select pg_temp.fail_if((select count(*) from public.complex_settings) <> 2,
  'trigger fn_handle_new_complex creó settings (2)');

-- ============ PRECIOS ============
select pg_temp.fail_if(
  public.fn_resolve_price(:'complex_id', :'c1_id', '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz) <> 20000,
  'fn_resolve_price martes 20hs = 20000 (Noche)');
select pg_temp.fail_if(
  public.fn_resolve_price(:'complex_id', :'c1_id', '2026-09-12 10:00 America/Argentina/Buenos_Aires'::timestamptz) <> 25000,
  'fn_resolve_price sábado = 25000 (día específico gana)');

-- ============ CREAR RESERVA ============
select id, status::text, price, deposit_amount
from public.fn_create_reservation(:'c1_id', '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz, null, :'cust_id', 'booking', null, 'admin') \gset r1_

select pg_temp.fail_if(
  :'r1_status' <> 'confirmed' or :'r1_price'::numeric <> 20000 or :'r1_deposit_amount'::numeric <> 6000,
  'reserva admin confirmed 20000 / seña 30% = 6000');

-- ============ DOBLE RESERVA ============
select pg_temp.expect_exclusion(:'c1_id', '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz, :'cust_id');

-- insert directo solapado parcial (race-condition proof a nivel motor)
select pg_temp.expect_unique(format(
  'insert into public.reservations (complex_id, court_id, customer_id, kind, status, starts_at, ends_at)
   values (%L, %L, %L, ''booking'', ''pending'', ''2026-09-08 20:30 America/Argentina/Buenos_Aires''::timestamptz, ''2026-09-08 22:00 America/Argentina/Buenos_Aires''::timestamptz)',
  :'complex_id', :'c1_id', :'cust_id'));

-- mismo horario en otra cancha → permitido
insert into public.reservations (complex_id, court_id, customer_id, kind, status, starts_at, ends_at)
values (:'complex_id', :'c2_id', :'cust_id', 'booking', 'confirmed',
        '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz,
        '2026-09-08 21:30 America/Argentina/Buenos_Aires'::timestamptz);
select pg_temp.fail_if(
  (select count(*) from public.reservations where starts_at = '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz and status = 'confirmed') <> 2,
  'mismo horario en canchas distintas permitido');

-- ============ FUERA DE HORARIO / DÍA CERRADO ============
select pg_temp.expect_outside_hours(:'c1_id', '2026-09-08 23:30 America/Argentina/Buenos_Aires'::timestamptz, :'cust_id');
select pg_temp.expect_outside_hours(:'c1_id', '2026-09-13 20:00 America/Argentina/Buenos_Aires'::timestamptz, :'cust_id');

-- ============ CANCELAR LIBERA EL SLOT ============
select public.fn_cancel_reservation(:'r1_id', 'test cancel', false) is not null as cancelada;
select id from public.fn_create_reservation(:'c1_id', '2026-09-08 20:00 America/Argentina/Buenos_Aires'::timestamptz, null, :'cust_id', 'booking', null, 'admin') \gset r2_
select pg_temp.fail_if(:'r2_id' is null, 'cancelación liberó el rango → re-reserva OK');

-- ============ HOLD ONLINE + EXPIRACIÓN ============
select id, status::text, (expires_at is not null) as tiene_hold
from public.fn_create_reservation(:'c1_id', '2026-09-09 10:00 America/Argentina/Buenos_Aires'::timestamptz, null, :'cust_id', 'booking', null, 'online') \gset h1_

select pg_temp.fail_if(:'h1_status' <> 'pending' or :'h1_tiene_hold' <> 't',
  'reserva online → pending con hold TTL');

update public.reservations set expires_at = now() - interval '1 minute' where id = :'h1_id';
select public.fn_expire_reservation_holds() as holds_expirados;
select pg_temp.fail_if((select status::text from public.reservations where id = :'h1_id') <> 'expired',
  'fn_expire_reservation_holds marcó expired');

select id from public.fn_create_reservation(:'c1_id', '2026-09-09 10:00 America/Argentina/Buenos_Aires'::timestamptz, null, :'cust_id', 'booking', null, 'admin') \gset h2_
select pg_temp.fail_if(:'h2_id' is null, 'slot del hold expirado quedó libre');

-- ============ PAGOS ============
insert into public.payments (complex_id, reservation_id, customer_id, provider, provider_payment_id, concept, amount, status, approved_at)
values (:'complex_id', :'r2_id', :'cust_id', 'mercadopago', 'mp_001', 'deposit', 6000, 'approved', now());
insert into public.payments (complex_id, reservation_id, customer_id, provider, provider_payment_id, concept, amount, status, approved_at)
values (:'complex_id', :'r2_id', :'cust_id', 'mercadopago', 'mp_002', 'balance', 14000, 'approved', now());
select pg_temp.fail_if((select paid_amount from public.reservations where id = :'r2_id') <> 20000,
  'trigger sync paid_amount: deposit 6000 + balance 14000 = 20000');

insert into public.payments (complex_id, reservation_id, customer_id, provider, provider_payment_id, concept, amount, status, approved_at)
values (:'complex_id', :'r2_id', :'cust_id', 'mercadopago', 'mp_003', 'refund', 6000, 'approved', now());
select pg_temp.fail_if((select paid_amount from public.reservations where id = :'r2_id') <> 14000,
  'refund descontó → paid_amount 14000');

-- idempotencia: mismo provider_payment_id
select pg_temp.expect_unique(format(
  'insert into public.payments (complex_id, reservation_id, provider, provider_payment_id, concept, amount, status)
   values (%L, %L, ''mercadopago'', ''mp_002'', ''full'', 1, ''approved'')',
  :'complex_id', :'r2_id'));

-- webhook idempotente
insert into public.webhook_events (external_event_id, event_type, payload) values ('evt_1', 'payment', '{}');
select pg_temp.expect_unique(
  'insert into public.webhook_events (external_event_id, event_type, payload) values (''evt_1'', ''payment'', ''{}'')');

-- webhook inmutable
select pg_temp.expect_immutable(
  'update public.webhook_events set payload = ''{"x":1}'' where external_event_id = ''evt_1''');

-- auditoría: escribe fn_audit y es inmutable
select public.fn_audit(:'complex_id', 'smoke.test', 'reservations', :'r2_id', null, '{"a":1}');
select pg_temp.expect_immutable('delete from public.audit_logs');

-- ============ NORMALIZACIÓN ============
select pg_temp.fail_if(public.fn_normalize_text('JUAN PÉREZ,,,') <> 'juan perez',
  'fn_normalize_text: JUAN PÉREZ,,, → juan perez');
select pg_temp.fail_if((select name_normalized from public.customers where id = :'cust_id') <> 'juan perez',
  'columna generada name_normalized');
select pg_temp.fail_if((select phone_normalized from public.customers where id = :'cust_id') <> '541144445555',
  'columna generada phone_normalized (solo dígitos)');

select pg_temp.expect_unique(format(
  'insert into public.customers (complex_id, first_name, email) values (%L, ''Otro'', ''juan@test.com'')',
  :'complex_id'));

-- ============ SERIES RECURRENTES ============
insert into public.reservation_series (complex_id, court_id, customer_id, day_of_week, start_time, duration_minutes, valid_from, valid_until)
values (:'complex_id', :'c2_id', :'cust_id', 2, '20:00', 90, '2026-09-08', '2026-09-30') returning id \gset ser_

select count(*) filter (where created) as creadas, count(*) filter (where not created) as conflictos
from public.fn_generate_series_occurrences(:'ser_id') \gset gen_

select pg_temp.fail_if(:gen_creadas <> 3 or :gen_conflictos <> 1,
  'serie: 3 ocurrencias creadas + 1 conflicto reportado (8/9 ocupado en Cancha 2)');

-- ============ SLOTS DISPONIBLES ============
select count(*) as total_slots, count(*) filter (where is_available) as libres
from public.fn_available_slots(:'c1_id', '2026-09-08') \gset slots_

select pg_temp.fail_if(:slots_total_slots <> 9 or :slots_libres <> 7,
  'fn_available_slots: 9 slots de 90min (09-23), 7 libres (r2 20:00 pisa 19:30 y 21:00)');

select pg_temp.fail_if((select count(*) from public.fn_available_slots(:'c1_id', '2026-09-13')) <> 0,
  'fn_available_slots domingo cerrado → 0 slots');

-- ============ KPIs / OCUPACIÓN / COMPARATIVA / FICHA CLIENTE ============
select * from public.fn_complex_kpis(:'complex_id', '2026-09-01', '2026-09-30');
select * from public.fn_occupancy_by_court(:'complex_id', '2026-09-01', '2026-09-30');
select * from public.fn_compare_periods(:'complex_id', '2026-09-01', '2026-09-30', '2026-10-01', '2026-10-31');
select first_name, reservations_count, total_spent, favorite_court_name, favorite_hour
from public.v_customer_stats where customer_id = :'cust_id';
select count(*) as detalle_reservas from public.v_reservations_detail where complex_id = :'complex_id';

-- ============ RLS: aislamiento multi-tenant ============
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'staffb@test.com');
select pg_temp.fail_if((select count(*) from public.user_profiles) <> 2,
  'trigger auth.users → user_profiles');

insert into public.complex_members (complex_id, user_id, role) values
  (:'complex_id', '11111111-1111-1111-1111-111111111111', 'complex_owner'),
  (:'comb_id',    '22222222-2222-2222-2222-222222222222', 'staff');

insert into public.customers (complex_id, first_name, last_name) values (:'comb_id', 'Privado', 'DeB');

\echo '--- RLS: owner de A (esperado: complejos=1, clientes=1 [Juan], reservas=8, pagos=3) ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select
  (select count(*) from public.complexes)     as complejos,
  (select count(*) from public.customers)     as clientes,
  (select count(*) from public.reservations)  as reservas,
  (select count(*) from public.payments)      as pagos;
rollback;

\echo '--- RLS: staff de B (esperado: complejos=1 [B], clientes=1 [Privado], reservas=0) ---'
begin;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select
  (select count(*) from public.complexes)     as complejos,
  (select count(*) from public.customers)     as clientes,
  (select count(*) from public.reservations)  as reservas;
rollback;

\echo '--- RLS: anon (esperado: complejos=0, nada público habilitado) ---'
begin;
set local role anon;
select
  (select count(*) from public.complexes)     as complejos,
  (select count(*) from public.courts)        as canchas;
rollback;

\echo '--- RLS: sitio público habilitado → anon ve canchas y precios ---'
update public.complexes set public_site_enabled = true where id = :'comb_id';
begin;
set local role anon;
select count(*) as canchas_publicas_b from public.courts;
rollback;

\echo 'SMOKE TEST COMPLETO'
