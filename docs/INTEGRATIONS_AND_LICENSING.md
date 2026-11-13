# Mejores Prácticas de Integración (Supabase + Bot API) y Estrategia Comercial

Guía técnica para escalar **SportManager / PlayHub** a producción y proteger/monetizar el proyecto frente a copias comerciales.

---

## 1. Arquitectura de Datos y Supabase (Demo vs. Producción)

El proyecto ya separa la capa de lectura en `src/services/*.ts` (demo) y `src/services/*-real.ts` (Supabase), junto con las migraciones `supabase/migrations/0001` a `0010` y `getComplexScope()` en `src/services/db.ts`.

### Buenas prácticas clave para completar la integración real
1. **Unificar mutaciones detrás de Server Actions / Services**:
   - Actualmente, crear/editar clientes (`customers-client.tsx`) e importar Excel (`excel-client.tsx`) persisten en `localStorage` cuando `isDemoMode()` está activo.
   - **Regla**: Toda escritura debe pasar por una Server Action (`actions.ts`) que delegue en `src/services/*`:
     - Si `isDemoMode()`: devuelve éxito para que el cliente actualice su estado local.
     - Si producción: valida con `zod`, resuelve `getComplexScope()` y ejecuta `insert`/`upsert` en Supabase.
   - Así los componentes React nunca importan `@supabase/*` ni `cookies()` directamente.

2. **Seguridad Multi-Tenant (RLS + Scope)**:
   - Nunca confiar en un `complex_id` enviado desde el frontend; derivarlo siempre en el servidor con `getComplexScope()`.
   - Mantener `src/lib/supabase/admin.ts` (Service Role) **exclusivamente** para:
     - Webhooks externos (pagos, bot de WhatsApp).
     - Cron jobs (`/api/cron/reminders`).
   - En cualquier ruta que use `admin.ts`, validar firma HMAC o `CRON_SECRET` con comparación en tiempo constante (`crypto.timingSafeEqual`).

3. **Reservas atómicas (sin doble reserva)**:
   - Las reservas creadas desde web, dashboard o bot deben usar una función RPC en PostgreSQL (`book_reservation(...)`) o constraint `EXCLUDE USING gist` sobre `(court_id, tstzrange(starts_at, ends_at))` donde `status NOT IN ('cancelled')`.
   - Esto garantiza que aunque dos jugadores o el bot reserven el mismo turno al mismo milisegundo, la base rechace el conflicto de forma atómica.

4. **Observabilidad y Auditoría**:
   - Registrar cada acción crítica (cambios de tarifa, cancelaciones, importaciones masivas, reservas creadas por bot) en `audit_logs` con `actor_type` (`owner` | `operator` | `customer` | `bot` | `system`).

---

## 2. Integración futura con API de Bot (WhatsApp / Telegram / IA)

Para conectar un bot conversacional que consulte disponibilidad, reserve turnos y envíe recordatorios sin acoplar la lógica al proveedor (Meta Cloud API, Twilio, Evolution API, n8n):

### Estructura recomendada
```text
src/
├── app/api/bot/webhook/route.ts   # Recepción y verificación de firma HMAC
├── lib/bot/
│   ├── types.ts                   # Contrato normalizado (BotInboundMessage, BotReply)
│   ├── intents.ts                 # Despacho / tool-calling (consultar, reservar, cancelar)
│   └── idempotency.ts             # Evita procesar 2 veces el mismo message_id
└── services/bot-real.ts           # Operaciones sobre Supabase usando admin.ts
```

### Reglas de oro para el Bot
1. **Idempotencia obligatoria**: los webhooks de WhatsApp/Meta reintentan si tardás más de unos segundos. Guardá `external_message_id` con índice único; si ya existe, respondé `200 OK` sin volver a reservar.
2. **Aislamiento por complejo**: resolver `complex_id` a partir del `phone_number_id` / canal receptor en una tabla `complex_channels`, nunca por texto del usuario.
3. **Máquina de estados / Confirmación explícita**: antes de crear una reserva (`kind: 'booking'`), el bot debe confirmar cancha, fecha, hora y precio/seña. Si requiere seña, generar link de pago y dejar la reserva en `pending` con `expires_at` (ej. 15 min).
4. **Handoff a humano**: si el jugador pide hablar con alguien o el bot falla 2 veces seguidas, marcar la conversación para atención humana y notificar al operador en `/dashboard/notificaciones`.
5. **Rate limiting**: limitar mensajes por número de teléfono por minuto para evitar abuso o loops de auto-respuesta entre bots.

---

## 3. Cómo evitar que te copien el proyecto gratis y cómo monetizarlo

Actualmente el archivo `LICENSE` del repositorio es **MIT**, que permite legalmente a cualquiera copiar, modificar y vender tu código sin pagarte ni avisarte.

### Opciones concretas para que te paguen si lo usan comercialmente

1. **Modelo Open-Core (el más efectivo en SaaS)**
   - **Público en GitHub (MIT o Apache 2.0)**: el frontend del dashboard, modo demo y portal básico (ideal para tu portafolio y para que clientes vean la calidad del producto).
   - **Privado / Pago (repositorio aparte o paquetes privados)**:
     - Migraciones completas de producción + RLS avanzado + RPCs atómicas.
     - Integración real de **MercadoPago / Stripe** (señas automáticas y conciliación).
     - **Bot de WhatsApp** con IA y recordatorios automáticos.
     - Módulo **Multi-Club / SuperAdmin** y despliegue automatizado.
   - Quien quiera usarlo como negocio real necesita exactamente esas piezas y te compra la licencia o el SaaS.

2. **Cambio de Licencia a Dual-Licensing (AGPLv3 o BSL 1.1)**
   - **AGPLv3 + Licencia Comercial**: si alguien modifica el código y lo levanta en un servidor para dar servicio a terceros, la AGPL lo obliga a liberar todo su código fuente. Las empresas que no quieren liberar su código pagan tu **Licencia Comercial**.
   - **BSL 1.1 (Business Source License)**: permite ver y probar el código, pero **prohíbe el uso en producción comercial** sin pagar una licencia hasta una fecha futura (ej. 3–4 años).
   - *Nota*: Esto protege el código publicado a partir de ahora; las versiones anteriores ya publicadas bajo MIT siguen siendo MIT.

3. **Venta de "Boilerplate / White-Label" + Setup (Ticket alto)**
   - Dejá el repo como **Demo / Showcase** con `README` claro: *"Licencia comercial y código de producción con Supabase + MercadoPago + WhatsApp Bot disponible en [tu link de LemonSqueezy / Gumroad / Stripe]"*.
   - Ofrecé 3 planes:
     - **Licencia Single-Club**: pago único para instalar en 1 complejo.
     - **Licencia Agencia / Multi-Club**: pago único más alto para quienes quieren revenderlo a otros clubes.
     - **Setup + Hosting gestionado (SaaS)**: abono mensual por complejo.

4. **Mantener el Repo Principal Privado y publicar solo un Showcase**
   - Si tu objetivo principal no es recibir PRs open-source sino conseguir clientes o vender el software, lo más seguro es pasar el repo con lógica de negocio real a **privado** y dejar público únicamente el showcase/documentación o una demo desplegada en Vercel.
