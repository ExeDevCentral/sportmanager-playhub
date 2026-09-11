# Arquitectura — Plataforma SaaS de Gestión para Complejos de Pádel

> Versión 1.0 · 2026-09-07
> Stack: Next.js 15+ (App Router) · TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres, Auth, Realtime, RLS, Storage) · Mercado Pago · Resend · WhatsApp Business Cloud API · SheetJS

---

## 1. Decisiones arquitectónicas clave

### 1.1 Multi-tenancy: base única + `complex_id` + RLS ✅ (elegida)

| Alternativa | Pros | Contras |
|---|---|---|
| **DB única, tenant por fila (`complex_id`) + RLS** | Simple, barato, un solo schema, RLS aísla tenants | RLS debe ser exhaustiva |
| Schema por tenant | Aislamiento fuerte | Migraciones × N, coste operativo alto |
| DB por tenant | Máximo aislamiento | Inviable en tier gratuito, complejidad extrema |

Toda entidad de negocio lleva `complex_id NOT NULL` + índice. Las políticas RLS usan funciones helper (`current_complex_role`, `has_complex_role`) para que un admin de un complejo **nunca** vea datos de otro. `platform_admin` (rol en `user_profiles`) ve todo.

### 1.2 Anti doble-reserva: EXCLUDE constraint (GiST) en PostgreSQL ✅ (elegida)

| Alternativa | Pros | Contras |
|---|---|---|
| **Constraint de exclusión `tstzrange && ` + `btree_gist`** | Garantía a nivel motor, race-condition-proof, sin locking manual | Requiere extensión btree_gist |
| Advisory locks | Flexibles | Hay que gestionar liberación, propenso a bugs |
| Validar en app (SELECT + INSERT) | Simple | Race condition real bajo concurrencia |
| Transacciones SERIALIZABLE | Correctas | Retries, peor throughput |

```sql
EXCLUDE USING gist (court_id WITH =, tstzrange(starts_at, ends_at) WITH &&)
WHERE (status IN ('pending','confirmed','completed','no_show'))
```

Las reservas `cancelled / expired / refunded` **liberan el rango**. La función `create_reservation()` (SECURITY DEFINER) valida negocio y traduce la violación (`SQLSTATE 23P01`) a un error amigable `RESERVATION_CONFLICT`. El frontend se actualiza con **Supabase Realtime** sobre `reservations`.

### 1.3 Ciclo de vida de la reserva con "hold" temporal

```
Cliente elige slot → create_reservation() → status = pending, expires_at = now() + 15 min
      → Checkout Mercado Pago (seña o total, configurable)
      → Webhook → payment approved → status = confirmed (idempotente)
      → Si no paga → job pg_cron expira el hold → status = expired → slot liberado
```

### 1.4 Dinero: `numeric(14,2)` + `currency char(3)` ✅

Enteros en centavos es más "puro" pero el contexto argentino (inflación, importación de Excel con decimales, MP que opera en pesos con centavos) hace que `numeric(14,2)` sea más pragmático y legible en reportes.

### 1.5 Reservas recurrentes: tabla `reservation_series` + ocurrencias reales

La serie es la definición ("martes 20:00, cancha 3, por 3 meses"); las ocurrencias son filas normales en `reservations` con `series_id` + `occurrence_index`. Esto permite cancelar/modificar una ocurrencia sin lógica especial y mantiene el EXCLUDE constraint funcionando igual.

### 1.6 Pagos: confirmación SOLO por webhook + tabla `webhook_events` idempotente

- `UNIQUE (provider, external_event_id, event_type)` → reprocesar un webhook es seguro.
- `payments` guarda `raw_payload jsonb` para auditoría/reconciliación.
- `UNIQUE (provider, provider_payment_id)` evita pagos duplicados.

### 1.7 Notificaciones: patrón outbox desacoplado

Tabla `notifications` (cola persistente) + `notification_templates` (por complejo o globales). Un worker (Edge Function invocada por pg_cron/trigger) despacha a Resend o WhatsApp Cloud API. Cambiar de proveedor = tocar solo el adaptador en `src/lib/notifications/`.

### 1.8 Importación Excel: staging + jobs auditables

`import_jobs` (estado del proceso: uploaded → parsed → mapped → validated → importing → completed) + `import_rows` (cada fila en `jsonb` con estado, errores y `matched_customer_id` sugerido). **Nunca** se borra nada: la fila importada guarda `import_job_id`/`import_row_id` como trazabilidad. La deduplicación de clientes usa email → teléfono normalizado → `fn_normalize_text(nombre)` (unaccent + lower + strip, columna generada indexada con pg_trgm).

### 1.9 Lógica de negocio: services, no componentes (spec §35)

```
UI (Server/Client Components) → services/* (casos de uso) → lib/* (integraciones) → Supabase
```

- Operaciones críticas (crear reserva, procesar webhook) → funciones Postgres SECURITY DEFINER o Route Handlers con `service_role` **solo en servidor**.
- La `service_role key` jamás llega al cliente. El navegador usa `anon` + RLS.

### 1.10 Auth

Supabase Auth (Google, Apple, email/password, magic link; OTP teléfono preparado). Trigger `on_auth_user_created` crea `user_profiles`. La pertenencia a un complejo vive en `complex_members` (rol por complejo), no en el JWT → un usuario puede ser staff del complejo A y customer del B.

---

## 2. Modelo de datos (ERD conceptual)

```
user_profiles 1──N complex_members N──1 complexes 1──1 complex_settings
                                        │
        ┌───────────────┬───────────────┼────────────────┬──────────────┐
     courts      operating_hours    rate_rules      promotions      customers
        │              (complex o      (precio por    (descuentos)     │
        │               court, por      cancha/día/                     │
        │               día semana)     franja)                         │
        └──────────────┬──────────────────────────────────┬────────────┘
                 reservations N──1 reservation_series     │
                       │  (EXCLUDE gist anti-overlap)     │
                    payments N────────────────────────────┘
                       │
                 webhook_events (idempotencia MP)

notifications ── notification_templates
import_jobs ── import_rows (staging Excel)
audit_logs (append-only, old/new jsonb)
```

Enums principales: `complex_role(owner|admin|staff)`, `reservation_status(pending|confirmed|cancelled|completed|no_show|expired|refunded)`, `reservation_kind(booking|block|maintenance|event)`, `payment_status(pending|approved|rejected|cancelled|refunded|charged_back)`, `payment_concept(deposit|full|balance|refund)`, `notification_channel(email|whatsapp)`.

---

## 3. Estructura de carpetas Next.js

```
src/
├── app/
│   ├── (public)/                    # sitio público del complejo (slug-based)
│   │   ├── [complexSlug]/page.tsx           # landing
│   │   ├── [complexSlug]/canchas/
│   │   ├── [complexSlug]/precios/
│   │   └── [complexSlug]/reservar/          # flujo de reserva online
│   ├── (auth)/login/ · register/ · callback/
│   ├── dashboard/                   # privado (middleware protege)
│   │   ├── page.tsx                         # home KPIs
│   │   ├── calendario/ · reservas/ · clientes/[id]/ · canchas/
│   │   ├── pagos/ · reportes/ · historicos/ · importaciones/
│   │   └── configuracion/
│   └── api/
│       ├── webhooks/mercadopago/route.ts    # verificación + idempotencia
│       ├── reservations/route.ts
│       ├── payments/route.ts
│       ├── exports/route.ts                 # xlsx server-side
│       └── imports/route.ts
├── components/
│   ├── ui/                          # shadcn
│   ├── calendar/                    # FullCalendar wrappers
│   ├── dashboard/ · customers/ · imports/ · public/
├── lib/
│   ├── supabase/{client,server,admin,middleware}.ts
│   ├── mercadopago/{checkout,webhook}.ts
│   ├── notifications/{index,resend,whatsapp,templates}.ts
│   ├── excel/{parse,map,validate,export}.ts
│   └── validations/                 # zod schemas reutilizables
├── services/                        # lógica de negocio (no UI)
│   ├── reservations/{availability,create,cancel,recurring}.ts
│   ├── payments/{checkout,confirm,refund}.ts
│   ├── customers/{crm,dedupe}.ts
│   ├── analytics/{kpi,occupancy,revenue,compare}.ts
│   └── imports/{job,normalize,commit}.ts
├── types/                           # DTOs, DB types (supabase gen types)
└── middleware.ts                    # protección de rutas /dashboard
supabase/
├── migrations/0001..0010            # este esquema
└── seed.sql                         # datos demo (pendiente Fase 1)
```

---

## 4. Flujos críticos

### Reserva online (cliente)
1. UI consulta disponibilidad (`fn_available_slots` / rate_rules) — solo lectura.
2. Server Action/Route Handler → `create_reservation()` en Postgres (hold 15 min). Si `RESERVATION_CONFLICT` → UI muestra "el turno ya no está disponible" (Realtime ya actualizó la grilla).
3. Backend crea preferencia MP (seña según `complex_settings.deposit_*`) → redirect.
4. Webhook MP → `webhook_events` (unique) → verifica pago con API de MP (no confiar en el body) → `payment approved` + `reservation confirmed` → encola `notifications` → Resend + WhatsApp.

### Importación Excel
Subir a Storage → parsear (SheetJS, server) → detectar hojas/columnas → preview + mapping (UI) → validación (fechas, precios, duplicados, canchas inexistentes) → dedupe de clientes con sugerencias → commit transaccional fila a fila con `import_rows.status` → reporte final auditable.

---

## 5. Roadmap de implementación (spec §41)

Fase 1 scaffold Next/Supabase → **Fase 2 DB (este entregable: migrations 0001–0010)** → Fase 3 Auth → Fase 4 Dashboard shell → Fase 5 Calendario/Reservas → Fase 6 MP → Fase 7 Notificaciones → Fase 8 CRM → Fase 9 Excel → Fase 10 Analytics → Fase 11 Público → Fase 12 Testing (race conditions, RLS, webhooks).

## 6. Convenciones

- IDs `uuid default gen_random_uuid()`; tiempos `timestamptz`; `created_at/updated_at` con trigger.
- Nombres de tablas snake_case plural; enums `public.*`; funciones `fn_*`, vistas `v_*`.
- Todas las tablas tenant con RLS **habilitado desde la migración** (no después).
- Types TS generados con `supabase gen types typescript` → `src/types/database.ts`.
