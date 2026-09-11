-- ============================================================
-- 0008 · Importación de históricos Excel (spec §17–§19)
-- import_jobs (proceso auditable) · import_rows (staging)
-- ============================================================

-- ---------- Jobs de importación ----------
create table public.import_jobs (
  id                 uuid primary key default gen_random_uuid(),
  complex_id         uuid not null references public.complexes (id) on delete cascade,
  created_by         uuid references public.user_profiles (id) on delete set null,

  file_name          text not null,
  storage_path       text not null,              -- ruta en Supabase Storage
  sheet_name         text,                       -- hoja seleccionada (paso 2)
  entity_types       text[] not null default '{reservations}', -- reservations / customers / payments

  status             public.import_job_status not null default 'uploaded',
  column_mapping     jsonb,                      -- { "Cliente": "customer_name", … } (paso 5)
  normalization_rules jsonb,                     -- reglas configurables de dedupe (spec §19)
  error_report       jsonb,                      -- resumen de validación (paso 6)

  total_rows         integer not null default 0,
  valid_rows         integer not null default 0,
  invalid_rows       integer not null default 0,
  imported_rows      integer not null default 0,
  skipped_rows       integer not null default 0,

  started_at         timestamptz,
  finished_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_import_jobs_complex on public.import_jobs (complex_id, created_at desc);

create trigger trg_import_jobs_updated
  before update on public.import_jobs
  for each row execute function public.fn_set_updated_at();

-- ---------- Filas en staging (1 fila Excel = 1 import_row, siempre conservada) ----------
create table public.import_rows (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references public.import_jobs (id) on delete cascade,
  row_number           integer not null,          -- fila original en el Excel (para trazabilidad)

  raw                  jsonb not null,            -- datos crudos tal cual vienen del Excel
  normalized           jsonb,                     -- datos normalizados post-mapeo
  errors               jsonb not null default '[]', -- [{ "field": "date", "message": "fecha inválida" }]

  status               public.import_row_status not null default 'pending',
  is_duplicate         boolean not null default false,

  -- dedupe de clientes (spec §19): sugerencia + método, nunca fusión automática ciega
  matched_customer_id  uuid references public.customers (id) on delete set null,
  match_method         text check (match_method in ('email', 'phone', 'name', 'manual', 'none')),

  target_entity        text,                      -- qué se creó: 'customers', 'reservations', 'payments'
  target_id            uuid,                      -- id del registro creado/actualizado
  imported_at          timestamptz,

  created_at           timestamptz not null default now(),
  unique (job_id, row_number)
);

create index idx_import_rows_job_status on public.import_rows (job_id, status);
create index idx_import_rows_match      on public.import_rows (matched_customer_id) where matched_customer_id is not null;

-- ---------- FK de trazabilidad hacia atrás ----------
alter table public.customers
  add constraint fk_customers_import_job
  foreign key (import_job_id) references public.import_jobs (id) on delete set null;

alter table public.reservations
  add constraint fk_reservations_import_job
  foreign key (import_job_id) references public.import_jobs (id) on delete set null,
  add constraint fk_reservations_import_row
  foreign key (import_row_id) references public.import_rows (id) on delete set null;

create index idx_customers_import_job    on public.customers (import_job_id) where import_job_id is not null;
create index idx_reservations_import_job on public.reservations (import_job_id) where import_job_id is not null;

alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
