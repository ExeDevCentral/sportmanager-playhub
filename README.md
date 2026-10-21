<div align="center">

# SportManager • PlayHub
### *High-Concurrency Multi-Tenant Athletic Facility Scheduler, Bi-Temporal Booking Engine & Financial Telemetry*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-GiST_Anti--Double_Booking-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase RLS](https://img.shields.io/badge/Supabase-Multi--Tenant_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>A bi-temporal reservation kernel and complex operations engine engineered with PostgreSQL generalized search tree (GiST) spatio-temporal exclusion constraints, deterministic mulberry32 mock staging, and automated tabular financial reconciliation.</b>
</p>

---

</div>

## 1. Abstract & System Architecture

Modern athletic facilities (padel, tennis, squash, multisport arenas) operate under tight temporal allocation envelopes where double-bookings, volatile cancellation rates, and unverified deposit receipts inflict direct revenue degradation.

**SportManager PlayHub** delivers a fault-tolerant, multi-tenant scheduling and financial platform:
- **Spatio-Temporal Conflict Elimination:** Implements PostgreSQL `EXCLUDE USING gist` exclusion constraints over court ID and half-open time ranges `[start_time, end_time)`, guaranteeing zero double-allocation at the relational kernel level.
- **Deterministic Dual-Server Simulation:** Incorporates a standalone HTTP mock server and client-side PRNG (`mulberry32`), allowing identical demo state reproduction without external credentials.
- **Bi-Temporal Financial Reconciliation:** Automated balance sheet parsing, ledger compilation, and Excel export via `xlsx`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPORTS COMPLEX SCHEDULING                       │
│    [Court Grid UI] ──► [Optimistic Slot Hold] ──► [PostgreSQL RPC]     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               RELATIONAL CONCURRENCY & INTEGRITY LAYER                 │
│    • GiST Exclusion: `EXCLUDE USING gist (court_id WITH =, slot WITH &&)` │
│    • Multi-Tenant Isolation: Strict `complex_id` Foreign Key Constraints│
│    • Webhook Idempotency: Cryptographically Verified Payment Callbacks  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│      FINANCIAL TELEMETRY (XLSX)  │        │   INTELLIGENT CLIENT MESSAGING   │
│   Dynamic Ledger Compilation     │        │   Automated WhatsApp Cloud Relay │
│   Balance Sheet Pivot Exports    │        │   Transactional Email Dispatch   │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

---

## 2. Theoretical Formulation: Spatio-Temporal Exclusion

Conventional application-layer conflict checks fail under concurrent HTTP race conditions ($T_1 \parallel T_2$). SportManager resolves schedule contention via database-level geometric domain theory:

$$\forall r_a, r_b \in \mathcal{R}, \quad (r_a.\text{court\_id} = r_b.\text{court\_id}) \implies (r_a.\text{interval} \cap r_b.\text{interval} = \emptyset)$$

Enforced in PostgreSQL via Generalized Search Trees:
```sql
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_slots
EXCLUDE USING gist (
  court_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
);
```
Any parallel transaction attempting to book overlapping quantum intervals is rejected instantaneously with a serialized constraint violation exception.

---

## 3. Technology Stack & Multi-Tier Topology

| Layer | Technology | Specification / Architectural Utility |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 | Turbopack compilation, React 19 Concurrent Server Components |
| **Styling** | Tailwind CSS v4 | Sports venue dynamic theming (`Radix UI`, `tw-animate-css`) |
| **Data Engine** | PostgreSQL 15 (Supabase) | Multi-tenant schema with Row Level Security (RLS) & RPCs |
| **Tabular Analytics** | SheetJS (`xlsx`) | Zero-latency browser-side Excel generation & auditing |
| **Visualization** | Recharts 3.8 | Dynamic court occupancy heatmaps & period comparison charts |
| **Data Validation** | Zod 4.x | Type-safe schema validation across API boundaries |

---

## 4. Dual-Runtime Operational Architecture

The system features an autonomous **Two-Tier Topology**:
1. **Mock Microservice (`server/mock-api.mjs`):** A standalone lightweight HTTP daemon operating on port `4000`, generating deterministic pseudo-random fixture data via `mulberry32`.
2. **Reverse Proxy Router (`/api/backend/*`):** Transparently proxies front-end requests to the active data tier with zero-CORS overhead and automated fallback to local state if the external daemon is partitioned.

```text
sportmanager-playhub/
├── server/
│   └── mock-api.mjs                 # Autonomous deterministic backend daemon (:4000)
├── src/
│   ├── app/
│   │   ├── (auth)/login/            # Multi-tier role-based authentication portal
│   │   ├── api/backend/[...path]/   # Same-origin resilient proxy router
│   │   ├── dashboard/               # Operational cockpit, KPIs & occupancy charts
│   │   └── page.tsx                 # Interactive dynamic landing page
│   ├── components/
│   │   ├── calendar/                # Grid scheduling & slot booking modal
│   │   ├── dashboard/               # Metric cards, sidebars & telemetry views
│   │   └── marketing/               # Dynamic promotional interface
│   ├── lib/                         # PRNG generators, auth wrappers & validators
│   ├── services/                    # Unified abstraction layer (Mock ↔ Supabase)
│   └── types/database.ts            # Generated TypeScript schema mirror
└── supabase/migrations/             # Hardened SQL migrations with GiST & RLS
```

---

## 5. Deployment & Development Lifecycle

### Prerequisites
- **Node.js**: $\ge 20.x$
- **NPM**: $\ge 10.x$

### Local Engineering Sandbox
```bash
# Clone the repository
git clone https://github.com/ExeDevCentral/sportmanager-playhub.git
cd sportmanager-playhub

# Install dependencies deterministically
npm install

# Launch Backend Simulation Daemon (Terminal 1)
npm run backend

# Launch Next.js 16 Web Application (Terminal 2)
npm run dev
```

### Verification & Health Probes
```bash
# Probe standalone mock daemon health
curl http://localhost:4000/health

# Verify Next.js proxy routing
curl http://localhost:3000/api/backend/demo/dashboard-data
```

### Production Build
```bash
npm run build
npm run start
```

---

## 6. License

Distributed under the **MIT License**. Engineered for modern athletic complexes, padel clubs, and municipal sports facilities.

<div align="center">
  <sub>Architected with operational precision by <a href="https://github.com/ExeDevCentral">ExeDevCentral</a>.</sub>
</div>
