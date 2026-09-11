-- ============================================================
-- 0006 · Pagos + idempotencia de webhooks (spec §27/§28)
-- ============================================================

-- ---------- Pagos ----------
create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  complex_id            uuid not null references public.complexes (id) on delete cascade,
  reservation_id        uuid references public.reservations (id) on delete set null,
  customer_id           uuid references public.customers (id) on delete set null,
  created_by            uuid references public.user_profiles (id) on delete set null,

  provider              public.payment_provider not null default 'mercadopago',
  provider_payment_id   text,                    -- id del pago en Mercado Pago
  provider_preference_id text,                   -- preference id del checkout
  concept               public.payment_concept not null default 'full',
  amount                numeric(14, 2) not null check (amount > 0),
  currency              char(3) not null default 'ARS',
  status                public.payment_status not null default 'pending',

  raw_payload           jsonb,                   -- respuesta completa de MP (auditoría/reconciliación)
  failure_reason        text,
  approved_at           timestamptz,
  refunded_at           timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Idempotencia: el mismo pago externo jamás se registra dos veces
create unique index uq_payments_provider_payment
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create index idx_payments_complex_created on public.payments (complex_id, created_at desc);
create index idx_payments_reservation     on public.payments (reservation_id) where reservation_id is not null;
create index idx_payments_customer        on public.payments (customer_id) where customer_id is not null;
create index idx_payments_status          on public.payments (complex_id, status);
create index idx_payments_preference      on public.payments (provider_preference_id) where provider_preference_id is not null;

create trigger trg_payments_updated
  before update on public.payments
  for each row execute function public.fn_set_updated_at();

-- ---------- Events de webhook (idempotencia de procesamiento) ----------
create table public.webhook_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'mercadopago',
  external_event_id text not null,               -- data.id / x-request-id de MP
  event_type        text not null,               -- payment, payment.refund, etc.
  payload           jsonb not null,
  status            public.webhook_event_status not null default 'received',
  error             text,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  -- reprocesar el mismo evento es un no-op seguro
  unique (provider, external_event_id, event_type)
);

create index idx_webhook_events_status on public.webhook_events (status) where status = 'received';

-- Los eventos de webhook son inmutables
create or replace function public.fn_prevent_row_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ROW_IS_IMMUTABLE' using errcode = '42501';
end;
$$;

create trigger trg_webhook_events_immutable
  before update of provider, external_event_id, event_type, payload or delete on public.webhook_events
  for each row execute function public.fn_prevent_row_modification();

-- ---------- Sincronización reservations.paid_amount (spec §38: nunca pago inconsistente) ----------
create or replace function public.fn_sync_reservation_paid_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation_id uuid := coalesce(new.reservation_id, old.reservation_id);
begin
  if v_reservation_id is not null then
    update public.reservations r
       set paid_amount = greatest(0, coalesce((
             select sum(case when p.concept = 'refund' then -p.amount else p.amount end)
             from public.payments p
             where p.reservation_id = v_reservation_id
               and p.status = 'approved'
           ), 0))
     where r.id = v_reservation_id;
  end if;
  return null; -- AFTER trigger: valor ignorado
end;
$$;

create trigger trg_sync_reservation_paid
  after insert or update of status, amount, concept or delete on public.payments
  for each row execute function public.fn_sync_reservation_paid_amount();

alter table public.payments      enable row level security;
alter table public.webhook_events enable row level security;
