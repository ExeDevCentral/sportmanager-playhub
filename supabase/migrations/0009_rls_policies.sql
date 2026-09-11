-- ============================================================
-- 0009 · Row Level Security — políticas por tabla (spec §6/§33)
-- Regla general: platform_admin ve todo; los roles de complejo se
-- resuelven con fn_has_complex_role / fn_is_complex_member.
-- El backend (service_role) bypasea RLS: webhooks, workers y
-- funciones SECURITY DEFINER operan fuera de estas políticas.
-- ============================================================

-- ============ user_profiles ============
create policy profiles_select on public.user_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.fn_is_platform_admin()
    -- miembros del mismo complejo (staff necesita ver perfiles de colegas)
    or exists (
      select 1
      from public.complex_members cm1
      join public.complex_members cm2 on cm2.complex_id = cm1.complex_id and cm2.is_active
      where cm1.user_id = user_profiles.id and cm1.is_active and cm2.user_id = auth.uid()
    )
  );

create policy profiles_update on public.user_profiles
  for update to authenticated
  using (id = auth.uid() or public.fn_is_platform_admin())
  with check (id = auth.uid() or public.fn_is_platform_admin());

-- Nadie escala su propio platform_role (solo service role o platform_admin)
create or replace function public.fn_guard_profile_platform_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.platform_role is distinct from old.platform_role
     and auth.uid() is not null
     and not public.fn_is_platform_admin() then
    raise exception 'FORBIDDEN_PLATFORM_ROLE_CHANGE' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_guard_profile_platform_role
  before update of platform_role on public.user_profiles
  for each row execute function public.fn_guard_profile_platform_role();

-- ============ complexes ============
create policy complexes_select on public.complexes
  for select to anon, authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_is_complex_member(id)
    or (public_site_enabled and status = 'active')   -- sitio público
  );

create policy complexes_insert on public.complexes
  for insert to authenticated
  with check (public.fn_is_platform_admin());

create policy complexes_update on public.complexes
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(id, 'complex_owner'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(id, 'complex_owner'));

create policy complexes_delete on public.complexes
  for delete to authenticated
  using (public.fn_is_platform_admin());

-- ============ complex_settings ============
create policy complex_settings_select on public.complex_settings
  for select to authenticated
  using (public.fn_is_platform_admin() or public.fn_is_complex_member(complex_id));

create policy complex_settings_upsert on public.complex_settings
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

create policy complex_settings_update on public.complex_settings
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

-- ============ complex_members ============
create policy complex_members_select on public.complex_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'complex_admin')
  );

create policy complex_members_insert on public.complex_members
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

create policy complex_members_update on public.complex_members
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

create policy complex_members_delete on public.complex_members
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

-- ============ courts ============
create policy courts_select on public.courts
  for select to anon, authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_is_complex_member(complex_id)
    or (is_public and exists (
          select 1 from public.complexes cx
          where cx.id = courts.complex_id and cx.public_site_enabled and cx.status = 'active'
        ))
  );

create policy courts_insert on public.courts
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy courts_update on public.courts
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy courts_delete on public.courts
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ operating_hours ============
create policy operating_hours_select on public.operating_hours
  for select to anon, authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_is_complex_member(complex_id)
    or exists (
         select 1 from public.complexes cx
         where cx.id = operating_hours.complex_id and cx.public_site_enabled and cx.status = 'active'
       )
  );

create policy operating_hours_insert on public.operating_hours
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy operating_hours_update on public.operating_hours
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy operating_hours_delete on public.operating_hours
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ rate_rules ============
create policy rate_rules_select on public.rate_rules
  for select to anon, authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_is_complex_member(complex_id)
    or exists (
         select 1 from public.complexes cx
         where cx.id = rate_rules.complex_id and cx.public_site_enabled and cx.status = 'active'
       )   -- precios públicos (landing)
  );

create policy rate_rules_insert on public.rate_rules
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy rate_rules_update on public.rate_rules
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy rate_rules_delete on public.rate_rules
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ promotions ============
create policy promotions_select on public.promotions
  for select to anon, authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_is_complex_member(complex_id)
    or (is_public and exists (
          select 1 from public.complexes cx
          join public.complex_settings cs on cs.complex_id = cx.id
          where cx.id = promotions.complex_id
            and cx.public_site_enabled and cx.status = 'active'
            and cs.publish_promotions
        ))
  );

create policy promotions_insert on public.promotions
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy promotions_update on public.promotions
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy promotions_delete on public.promotions
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ customers ============
create policy customers_select on public.customers
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or auth_user_id = auth.uid()
  );

-- Admin crea/edita clientes; el usuario logueado puede crear su propia ficha (guest → registro)
create policy customers_insert on public.customers
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'complex_admin')
    or auth_user_id = auth.uid()
  );

create policy customers_update on public.customers
  for update to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'complex_admin')
    or auth_user_id = auth.uid()
  )
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'complex_admin')
    or auth_user_id = auth.uid()
  );

-- El propio cliente jamás puede cambiar complex_id / vínculo auth / estado
create or replace function public.fn_guard_customer_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.fn_has_complex_role(old.complex_id, 'complex_admin') then
    if new.complex_id   is distinct from old.complex_id
       or new.auth_user_id is distinct from old.auth_user_id
       or new.status    is distinct from old.status then
      raise exception 'FORBIDDEN_CUSTOMER_FIELD_CHANGE' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_customer_self_edit
  before update on public.customers
  for each row execute function public.fn_guard_customer_self_edit();

create policy customers_delete on public.customers
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

-- ============ reservation_series ============
create policy reservation_series_select on public.reservation_series
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or public.fn_is_own_customer(customer_id)
  );

create policy reservation_series_insert on public.reservation_series
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or public.fn_is_own_customer(customer_id)
  );

create policy reservation_series_update on public.reservation_series
  for update to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or public.fn_is_own_customer(customer_id)
  )
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or public.fn_is_own_customer(customer_id)
  );

create policy reservation_series_delete on public.reservation_series
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ reservations ============
create policy reservations_select on public.reservations
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id))
  );

create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id))
  );

create policy reservations_update on public.reservations
  for update to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id)
        and kind = 'booking' and status in ('pending', 'confirmed'))
  )
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id)
        and kind = 'booking' and status in ('pending', 'confirmed', 'cancelled'))
  );

-- Un cliente solo puede cancelar su reserva: no puede mover cancha/horario/precio
create or replace function public.fn_guard_reservation_customer_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.fn_has_complex_role(old.complex_id, 'staff') then
    if new.court_id  is distinct from old.court_id
       or new.starts_at is distinct from old.starts_at
       or new.ends_at   is distinct from old.ends_at
       or new.price     is distinct from old.price
       or new.status not in ('cancelled') and new.status is distinct from old.status then
      raise exception 'CUSTOMER_CAN_ONLY_CANCEL' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_reservation_customer_edit
  before update on public.reservations
  for each row execute function public.fn_guard_reservation_customer_edit();

create policy reservations_delete on public.reservations
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

-- ============ payments ============
create policy payments_select on public.payments
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id))
  );

create policy payments_insert on public.payments
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or public.fn_has_complex_role(complex_id, 'staff')
    or (customer_id is not null and public.fn_is_own_customer(customer_id))
  );

-- El estado del pago SOLO lo mueve staff o el webhook (service_role bypass)
create policy payments_update on public.payments
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'staff'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'staff'));

-- Los pagos no se borran (integridad contable). Solo platform_admin.
create policy payments_delete on public.payments
  for delete to authenticated
  using (public.fn_is_platform_admin());

-- ============ webhook_events ============
-- Sin políticas de escritura: solo service_role (bypass RLS).
create policy webhook_events_select on public.webhook_events
  for select to authenticated
  using (public.fn_is_platform_admin());

-- ============ notification_templates ============
create policy notification_templates_select on public.notification_templates
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'staff'))
    or (complex_id is null and exists (
          select 1 from public.complex_members m
          where m.user_id = auth.uid() and m.is_active
        ))
  );

create policy notification_templates_insert on public.notification_templates
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'complex_admin'))
  );

create policy notification_templates_update on public.notification_templates
  for update to authenticated
  using (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'complex_admin'))
  )
  with check (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'complex_admin'))
  );

create policy notification_templates_delete on public.notification_templates
  for delete to authenticated
  using (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'complex_admin'))
  );

-- ============ notifications ============
create policy notifications_select on public.notifications
  for select to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'staff'));

create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'staff'));

-- update/delete: solo service_role (worker de despacho)

-- ============ audit_logs ============
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or (complex_id is not null and public.fn_has_complex_role(complex_id, 'complex_owner'))
  );

-- Sin políticas de insert/update/delete: se escribe vía fn_audit (SECURITY DEFINER)
-- y el trigger de inmutabilidad bloquea modificaciones.

-- ============ import_jobs / import_rows ============
create policy import_jobs_select on public.import_jobs
  for select to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy import_jobs_insert on public.import_jobs
  for insert to authenticated
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy import_jobs_update on public.import_jobs
  for update to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'))
  with check (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_admin'));

create policy import_jobs_delete on public.import_jobs
  for delete to authenticated
  using (public.fn_is_platform_admin() or public.fn_has_complex_role(complex_id, 'complex_owner'));

create policy import_rows_select on public.import_rows
  for select to authenticated
  using (
    public.fn_is_platform_admin()
    or exists (
         select 1 from public.import_jobs j
         where j.id = import_rows.job_id
           and public.fn_has_complex_role(j.complex_id, 'complex_admin')
       )
  );

create policy import_rows_insert on public.import_rows
  for insert to authenticated
  with check (
    public.fn_is_platform_admin()
    or exists (
         select 1 from public.import_jobs j
         where j.id = import_rows.job_id
           and public.fn_has_complex_role(j.complex_id, 'complex_admin')
       )
  );

create policy import_rows_update on public.import_rows
  for update to authenticated
  using (
    public.fn_is_platform_admin()
    or exists (
         select 1 from public.import_jobs j
         where j.id = import_rows.job_id
           and public.fn_has_complex_role(j.complex_id, 'complex_admin')
       )
  )
  with check (
    public.fn_is_platform_admin()
    or exists (
         select 1 from public.import_jobs j
         where j.id = import_rows.job_id
           and public.fn_has_complex_role(j.complex_id, 'complex_admin')
       )
  );
