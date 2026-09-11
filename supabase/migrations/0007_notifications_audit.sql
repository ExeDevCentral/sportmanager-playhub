-- ============================================================
-- 0007 · Notificaciones (outbox) + Auditoría (spec §29/§32)
-- ============================================================

-- ---------- Plantillas ----------
-- complex_id NULL = plantilla global por defecto de la plataforma.
create table public.notification_templates (
  id           uuid primary key default gen_random_uuid(),
  complex_id   uuid references public.complexes (id) on delete cascade,
  channel      public.notification_channel not null,
  template_key text not null,                 -- reservation.confirmed, reservation.reminder_24h, …
  subject      text,                          -- solo email
  body         text not null,                 -- soporta {{nombre}}, {{cancha}}, {{fecha}}, {{hora}}…
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index uq_template_complex on public.notification_templates (complex_id, channel, template_key) where complex_id is not null;
create unique index uq_template_global  on public.notification_templates (channel, template_key) where complex_id is null;

create trigger trg_notification_templates_updated
  before update on public.notification_templates
  for each row execute function public.fn_set_updated_at();

-- ---------- Outbox de notificaciones ----------
-- Todo lo que hay que enviar se encola acá; el worker (Edge Function/cron) despacha
-- al proveedor (Resend / WhatsApp Cloud API) y actualiza el estado.
create table public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  complex_id          uuid not null references public.complexes (id) on delete cascade,
  customer_id         uuid references public.customers (id) on delete set null,
  reservation_id      uuid references public.reservations (id) on delete set null,

  channel             public.notification_channel not null,
  template_key        text not null,
  recipient           text not null,            -- email o teléfono E.164
  payload             jsonb not null default '{}', -- variables ya renderizadas
  status              public.notification_status not null default 'queued',

  provider            text,                     -- 'resend', 'whatsapp_cloud', …
  provider_message_id text,
  scheduled_at        timestamptz not null default now(),
  attempts            smallint not null default 0,
  max_attempts        smallint not null default 3,
  last_error          text,
  sent_at             timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_notifications_queue   on public.notifications (status, scheduled_at) where status in ('queued', 'sending');
create index idx_notifications_complex on public.notifications (complex_id, created_at desc);
create index idx_notifications_res     on public.notifications (reservation_id) where reservation_id is not null;

create trigger trg_notifications_updated
  before update on public.notifications
  for each row execute function public.fn_set_updated_at();

-- ---------- Auditoría (append-only, spec §32) ----------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  complex_id  uuid references public.complexes (id) on delete set null, -- NULL = acciones de plataforma
  actor_id    uuid,                                    -- auth user; NULL = sistema
  actor_role  text,
  action      text not null,                           -- 'price.update', 'reservation.cancel', …
  entity_type text not null,                           -- 'rate_rules', 'reservations', …
  entity_id   text,
  old_data    jsonb,
  new_data    jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_complex_time on public.audit_logs (complex_id, created_at desc);
create index idx_audit_entity       on public.audit_logs (entity_type, entity_id);
create index idx_audit_actor        on public.audit_logs (actor_id);

create trigger trg_audit_logs_immutable
  before update or delete on public.audit_logs
  for each row execute function public.fn_prevent_row_modification();

-- Helper para que la capa service registre auditoría sin permisos extra
create or replace function public.fn_audit(
  p_complex_id  uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   text  default null,
  p_old_data    jsonb default null,
  p_new_data    jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (complex_id, actor_id, actor_role, action, entity_type, entity_id, old_data, new_data)
  values (
    p_complex_id,
    auth.uid(),
    case
      when public.fn_is_platform_admin() then 'platform_admin'
      when auth.uid() is null then 'system'
      else coalesce(public.fn_complex_role(p_complex_id)::text, 'customer')
    end,
    p_action, p_entity_type, p_entity_id, p_old_data, p_new_data
  );
end;
$$;

alter table public.notification_templates enable row level security;
alter table public.notifications          enable row level security;
alter table public.audit_logs             enable row level security;
