# SportManager / PlayHub

> El sistema operativo digital de tu centro deportivo.
> Reservas, pagos, clientes, equipo y Excel — en un solo centro de operaciones.

**Vivo en producción:** https://sportmanager-playhub.vercel.app
**Acceso demo:** `demo@sportmanager.app` / `operador@sportmanager.app` / `platform@sportmanager.app` · clave `playhub2026`

---

## 1. Manifiesto antropológico — por qué existe esto

Este software no nació de una hoja de ruta de producto. Nació de observar quién está
realmente detrás de un centro deportivo.

Hay un lugar en el mundo, muy repetido en Argentina y cada vez más en toda
Latinoamérica, donde el deporte dejó de ser un pasatiempo y pasó a ser una industria
de fines de semana. Pádel, tenis, tenis de mesa, squash, fútbol 5 y 11, futsal,
rugby, hockey, básquet, vóley, handball, natación, kayak, remo, atletismo,
running, golf, skate, escalada, funcional, yoga, crossfit: cada uno con su
espacio, su gente y su calendario. Y en cada uno de esos centros hay **una persona clave**: el dueño, el socio, o el encargado —
el **trabajador que gestiona todo**. Está en la ventanilla a las 9 de la mañana
recibiendo al equipo que viene a jugar, y a la medianoche sigue contestando WhatsApp
para armar la grilla del día siguiente.

Esa persona vive una paradoja:

- Su negocio es 100% **tiempo disponible**: si una cancha, una pista, un andarivel o
  una clase queda vacío en el horario pico, esa plata se pierde para siempre. No se
  recupera mañana.
- Pero su herramienta de gestión es 100% **desorden**: un grupo de WhatsApp con
  mensajes de "¿me anotás para las 20?", una planilla de Excel que se actualiza cada
  tanto, papeles pegados en la ventanilla, y señas que se cobran "a ojo" y se
  registran donde se puede.

No es falta de oficio. Es falta de soporte. La persona hace el trabajo de cinco:
vendedor, administrador, cajero, call center y gerente. Cada día.

Este proyecto es la respuesta a esa etnografía: **darle a esa persona un centro de
operaciones**. Un lugar único donde el caos de WhatsApp y Excel se convierte en
reservas confirmadas, pagos cobrados, clientes conocidos y decisiones tomadas con
datos.

> El valor que aportamos no es "digitalizar". Es **devolverle al trabajador el
> control de su operación** — horas de sueño, decisiones con números y el espacio
> siempre lleno. Tecnología no como fetiche, sino como acto de respeto hacia quien
> sostiene el negocio con las manos.

---

## 2. La etnografía del puesto de trabajo

### Cómo trabaja hoy el encargado

| Actividad | Herramienta actual | Fricción real |
|---|---|---|
| Anotar una reserva | WhatsApp | Mensajes perdidos, dobles reservas, sin confirmación |
| Cobrar la seña | Transferencia / efectivo | No hay registro, "lo anoto en un papel" |
| Saber quién viene mañana | Memoria + papel | La grilla se cuece a fuego lento de madrugada |
| Conocer a sus clientes | La cabeza | No distingue al que paga siempre del que no |
| Tomar decisiones | Intuición | ¿Qué horario rinde? ¿qué espacio? ¿a quién premiar? |
| Migrar años de historia | Excel + archivadores | Datos viejos intocables, duplicados, sin estructura |

### En qué se convierte con SportManager

La misma persona, con el mismo espacio, ahora con un panel desde el que:

1. **Reserva** desde un calendario visual multi-espacio: ve cada cancha, pista,
   andarivel o aula, cada hora, cada conflicto. La doble reserva es
   estructuralmente imposible.
2. **Cobra** con pagos que se confirman solos (Mercado Pago vía webhook) — nunca por
   la buena fe de un clic.
3. **Gestiona clientes** con ficha completa: frecuencia, gasto total, preferencia de
   canal (email o WhatsApp), espacio y horario favoritos.
4. **Importa su historia**: años de Excel entran mapeando columnas, validando
   duplicados y limpiando el desorden antes de tocar la operación.
5. **Mira el negocio**: ocupación por espacio, horarios más demandados, ingresos por
   espacio y actividad reciente — todo en tiempo real.

La transformación no es cosmética: es **operativa y cultural**. El encargado pasa de
"contestar mensajes" a "dirigir la operación".

---

## 3. Para quién es

- **Cualquier centro deportivo**: pádel, tenis, tenis de mesa, squash, fútbol 5 y
  11, futsal, rugby, hockey (césped y patín), básquet, vóley (y beach vóley),
  handball, natación, polo acuático, kayak, remo, surf/SUP, atletismo, running,
  trail, golf, skate, patinaje, escalada y clases/estudios (funcional, crossfit,
  spinning, pilates, yoga, artes marciales, boxeo) — y combos de varias
  disciplinas en un mismo predio que hoy se manejan con WhatsApp y Excel.
- **El trabajador/encargado** que gestiona todo y necesita un panel rápido, claro y
  que no lo traicione.
- **Cadenas / múltiples sedes**: arquitectura multi-complejo, métricas y equipos
  separados por sede.
- **Del deporte al territorio**: el modelo sirve para cualquier actividad que se
  venda por tiempo y espacio; cada vertical nueva (canchas, pistas, andariveles,
  aulas, clases, torneos, alquiler de espacios) es configurable sobre el mismo
  esquema sin cambios de código.

> **Multi-deporte por diseño**: el sistema no conoce de "canchas de pádel". Modela
> **espacios** (cancha, pista, andarivel, aula, ring, tatami, playa de arena, salón),
> **recursos** (luz, techo, superficie) y **turnos** vendibles por tiempo. Que un
> predio venda pádel, fútbol 5, natación o yoga es solo una configuración de
> `courts` + `rate_rules` + `operating_hours` en Supabase — el producto completo
> (reservas, pagos, CRM, notificaciones, importación Excel y analítica) no cambia.

### Roles

| Rol | Quién | Acceso |
|---|---|---|
| **Admin Dueño** (`complex_owner`) | El que decide el negocio | Todo: precios, promociones, analítica, históricos, importación y configuración |
| **Admin Operador** (`complex_admin`) | El encargado del día a día | Operación: dashboard, calendario, reservas, clientes, pagos y reportes |
| **Admin Plataforma** (`platform_admin`) | El staff de SportManager | Todos los complejos: estado general, ocupación, ingresos y acceso como dueño |

La regla se aplica en dos capas: **UI** (el sidebar solo muestra lo del rol) y
**servidor** (las rutas de dueño redirigen si el rol no alcanza). En PostgreSQL la
misma lógica vive en `fn_has_complex_role` + políticas RLS (0009), con
`complex_owner`/`complex_admin`/`staff`, y `platform_role` para el equipo de la plataforma.

---

## 4. Funciones

| Área | Qué hace |
|---|---|
| **Dashboard** | KPIs del día, reservas/ingresos/ocupación (30 días), agenda de hoy, histograma por espacio |
| **Calendario** | Grilla semanal multi-espacio, crear/editar/cancelar reservas, slots disponibles |
| **Reservas** | Listado completo de turnos con estados de pago y acciones |
| **Clientes (CRM)** | Ficha, historial, total gastado, canal preferido, favoritos, estados |
| **Espacios** | Catálogo de canchas/pistas/andariveles/clases y control de estado |
| **Horarios / Precios / Promociones** | Tarifas, disponibilidad y descuentos |
| **Pagos** | Confirmaciones vía webhook Mercado Pago (solo el backend marca "pagado") |
| **Notificaciones** | Email y/o WhatsApp según la preferencia de cada cliente |
| **Importar / Exportar** | Migración masiva desde Excel con validación y anti-duplicados |
| **Reportes / Analytics** | Lectura profunda de la operación (en construcción) |

---

## 5. Arquitectura

**SportManager/PlayHub corre como dos servidores en local y una app en la nube:**

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  FRONTEND · Next.js 16      │        │  BACKEND · Mock API (demo)       │
│  :3000  (dev / prod)        │  HTTP  │  :4000  /*  /api/…              │
│                             │────────▶│   dashboard · customers ·      │
│  Landing + Dashboard        │        │   calendar (+ datos reales      │
│  Server Actions + Servicios │        │   cuando se conecta Supabase)   │
└─────────────────────────────┘        └──────────────────────────────────┘
```

- **Frontend**: Next.js 16 · App Router · Turbopack · Tailwind 4 · shadcn/ui · TypeScript strict.
- **Backend demo**: servidor Node puro (`server/mock-api.mjs`) que sirve el mismo
  dataset determinista que el generador local — así el frontend siempre consume
  datos por HTTP, con **fallback automático** a generación local si el backend está caído.
  El navegador pasa por el proxy `GET /api/backend/*` (misma-origen, sin CORS, y
  seguro en cualquier dominio).
- **Producción**: Supabase (Postgres + Auth + RLS), Mercado Pago webhooks, Resend
  (email), WhatsApp Cloud API. Multi-tenant por `complex_id`; anti doble reserva con
  `EXCLUDE USING gist`.
- **Modo demo**: sin variables de Supabase todo funciona con datos mock conectado a
  un backend real por HTTP; al conectar credenciales, los servicios migran a queries
  reales sin tocar la UI.

### Servicios en capas

```
pages / client components
        │
        ▼
services/ (dashboard, calendar, customers, payments, notifications, excel, settings)
        │  isDemoMode() ? fetchBackend(...) ?? generador local : Supabase real
        ▼
data (Supabase · Postgres/RLS)  |  Mock API :4000  |  generadores deterministas
```

---

## 6. Empezar a trabajar (dos servidores)

Prerequisitos: Node 20+.

```bash
npm install

# Terminal 1 — Backend mock API (datos de demo por HTTP)
npm run backend          # http://localhost:4000  (health check: /health)

# Terminal 2 — Frontend
npm run dev              # http://localhost:3000
```

Probar el backend:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/demo/dashboard-data
curl http://localhost:3000/api/backend/demo/dashboard-data   # a través del proxy del frontend
```

### Acceso demo

Sin Supabase, el login pide una cuenta hardcodeada (`src/lib/auth/demo-account.ts`):

```
Admin Dueño  ·  demo@sportmanager.app   ·  playhub2026  ·  Martina Demo
Admin Operador  ·  operador@sportmanager.app  ·  playhub2026  ·  Ramiro Operador
Admin Plataforma  ·  platform@sportmanager.app  ·  playhub2026  ·  Débora Plataforma
```

Elegís el perfil en el login (o cambiás en el menú del avatar). La cuenta existe
solo en demo; al conectar Supabase el login vuelve a ser el real
(Google / Apple / email+clave / magic link) y el rol sale de `complex_members`.

---

## 7. Desplegar en Vercel

```bash
npm run deploy            # vercel deploy --prod
npm run deploy:preview    # vercel deploy
```

- `vercel.json` fija framework/builder/región (`gru1`).
- Sin env vars → el deploy corre en modo demo (con fallback local si :4000 no existe;
  en Vercel no hay backend siempre-on, por eso el fallback es clave).
- Para datos reales: cargar las variables de `.env.example` en el proyecto Vercel.

---

## 8. Estructura del repo

```
├── server/mock-api.mjs          # Backend mock (2° servidor · :4000)
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login demo / real
│   │   ├── api/backend/[...path]# Proxy del navegador al mock backend
│   │   ├── dashboard/           # Secciones del panel de operación
│   │   └── page.tsx             # Landing (stroke-draw, demo)
│   ├── components/
│   │   ├── marketing/           # Landing viva
│   │   ├── dashboard/           # Sidebar, topbar, KPIs, charts
│   │   └── calendar/            # Grilla, diálogo de reserva
│   ├── lib/                     # demo-data, backend client, env, auth, validations
│   ├── services/                # Capa de datos (demo ↔ backend ↔ Supabase)
│   └── types/database.ts        # Espejo del esquema SQL
└── supabase/migrations/         # SQL: RLS, funciones, vistas (0001-0010)
```

---

## 9. Cómo está pensada la calidad del demo

- **Datos deterministas**: los generadores usan seeds fijas (`mulberry32`) — los
  números nunca cambian entre renders ni entre usuarios para poder diseñar y validar UX.
- **Idénticos en ambos servidores**: el mock API replica exactamente los mismos
  generadores para que dé igual que los datos vengan de `:4000` o del fallback local.
- **Resiliencia**: si el backend cae, la UI no se rompe: cada servicio hace fallback
  al generador local.
- **Anti-doble-reserva** y **seguridad de pagos** están modelados en SQL/RPC desde
  el día uno (webhook como única fuente de verdad del "pagado").
- **Landing viva**: pelota que es el cursor (Web Audio, sin assets), stroke-draw
  que se repite al scroll, tipografía deportiva; todo respeta `prefers-reduced-motion`.

---

## 10. Estado y hoja de ruta

| Fase | Estado |
|---|---|
| 1–3 · Scaffold, auth, esquema SQL/RLS | ✅ |
| 4 · Dashboard + KPIs | ✅ |
| 5 · Calendario + reservas | ✅ |
| 6 · Pagos (webhook MP) | ✅ |
| 7 · Notificaciones (email/WhatsApp, canal preferido) | ✅ |
| 8 · CRM de clientes | ✅ |
| 9 · Import/export de Excel | ✅ |
| 10 · Landing v3 + demo | ✅ |
| 11 · Rebrand SportManager/PlayHub + deploy Vercel + 2 servidores | ✅ |
| 12 · Reservas (listado), Reportes, Analytics, Históricos | ✅ |
| 13 · Dark/cyber, multi-deporte, accesos y pulido | 🚧 siguiente |

### Auditoría de datos y próximos pasos

La auditoría estática de `supabase/migrations/0001-0010` confirma que el proyecto ya
incluye las tablas principales, triggers de `updated_at` y reglas de negocio, funciones
para reservas, slots, precios, pagos y KPIs, vistas de reportes, RLS y configuración de
Realtime. El esquema de tipos en `src/types/database.ts` está mantenido como espejo de
esas migraciones.

El modo Demo continúa siendo el camino operativo recomendado: usa datos deterministas,
no requiere credenciales ni altera Supabase. La auditoría SQL local queda pendiente de
ejecutarse con una instancia PostgreSQL/Supabase levantada (`supabase db lint --local`).

Backlog cercano para activar el modo real de forma segura:

1. Levantar un entorno Supabase de staging y ejecutar las migraciones en orden, seguido
   por `supabase db lint` y `supabase test db`.
2. Regenerar `src/types/database.ts` contra el proyecto desplegado y revisar diferencias.
3. Conectar primero `services/dashboard.ts` con `fn_complex_kpis`, `fn_occupancy_by_court`
   y `fn_compare_periods`, manteniendo fallback Demo.
4. Conectar calendario y reservas con `fn_available_slots`, `fn_create_reservation` y
   `fn_cancel_reservation`; validar doble reserva, horarios y expiración de holds.
5. Conectar pagos y notificaciones, verificando webhook idempotente, auditoría y RLS.
6. Completar clientes, históricos, importaciones, configuración y vista plataforma.
7. Ejecutar pruebas E2E con un complejo de staging antes de habilitar credenciales en
   producción.

## 11. Scripts útiles

```bash
npm run dev            # frontend dev :3000
npm run backend        # backend mock API :4000
npm run build          # build de producción
npm run start          # corre el build
npm run lint           # eslint
npm run deploy         # push a producción en Vercel
npm run deploy:preview # preview en Vercel
```

---

*SportManager/PlayHub — hecho para el trabajador que gestiona todo, con respeto por
la persona que convierte un espacio en un negocio que crece.*

*Pádel, tenis, tenis de mesa, squash, fútbol 5 y 11, rugby, hockey, básquet, vóley,
handball, natación, kayak, remo, atletismo, running, golf, skate, escalada,
funcional, yoga, crossfit — si se vende por tiempo y espacio, tiene lugar acá.*