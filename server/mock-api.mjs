// Backend mock de SportManager/PlayHub
// Sirve el MISMO dataset determinista que el frontend genera en modo demo
// (ver src/lib/demo-data.ts, src/services/customers.ts, src/services/calendar.ts)
// para que el frontend consuma datos reales desde un backend HTTP en :4000.
//
// Arranque:  npm run backend   (o:  node server/mock-api.mjs)
// Env:       PORT (por defecto 4000)

import http from "node:http";

const PORT = Number(process.env.PORT ?? 4000);

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDay = (d) => d.toISOString().slice(0, 10);
const shortLabel = (d) =>
  d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

// ── Dashboard (espejo de demo-data.ts) ─────────────────────────────────

function getDashboardData() {
  const rand = mulberry32(20260907);
  const today = new Date();

  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const trend = (29 - i) * 0.12;
    const base = 20 + trend + (isWeekend ? 9 : 0);
    const reservations = Math.round(base + rand() * 7 - 3);
    const avgPrice = 14000 + rand() * 4000;
    last30Days.push({
      date: isoDay(d),
      label: shortLabel(d),
      reservations,
      revenue: Math.round(reservations * avgPrice),
      cancellations: Math.round(rand() * 4),
      noShows: Math.round(rand() * 2),
    });
  }

  const todayEntry = last30Days[last30Days.length - 1];

  return {
    today: {
      reservationsToday: todayEntry.reservations,
      confirmedToday: Math.round(todayEntry.reservations * 0.86),
      revenueToday: todayEntry.revenue,
      occupancyToday: 78,
      availableCourtsNow: 3,
      totalCourts: 4,
      cancellationsToday: todayEntry.cancellations,
      noShowsToday: todayEntry.noShows,
      newCustomersToday: 2 + Math.round(rand() * 4),
    },
    last30Days,
    courts: [
      { court: "Cancha 1", occupancy: 82, revenue: 1240000, reservations: 184 },
      { court: "Cancha 2", occupancy: 74, revenue: 1105000, reservations: 169 },
      { court: "Cancha 3", occupancy: 69, revenue: 980000, reservations: 152 },
      { court: "Cancha 4", occupancy: 71, revenue: 1020000, reservations: 158 },
    ],
    peakHours: [
      { hour: "09", demand: 12 },
      { hour: "10", demand: 15 },
      { hour: "11", demand: 14 },
      { hour: "12", demand: 10 },
      { hour: "17", demand: 28 },
      { hour: "18", demand: 41 },
      { hour: "19", demand: 47 },
      { hour: "20", demand: 44 },
      { hour: "21", demand: 36 },
      { hour: "22", demand: 21 },
    ],
    todaySchedule: Array.from({ length: 8 }, (_, i) => {
      const hour = 15 + Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";
      return {
        id: `demo-${i}`,
        time: `${hour}:${minute}`,
        court: `Cancha ${(i % 4) + 1}`,
        customer: [
          "Juan Pérez", "María González", "Carlos Ruiz", "Ana Martínez",
          "Pedro Sánchez", "Lucía Fernández", "Diego Torres", "Sofía Castro",
        ][i % 8],
        status: ["confirmed", "confirmed", "pending", "confirmed", "cancelled"][i % 5],
        paid: i % 5 !== 2,
      };
    }),
  };
}

// ── Clientes (espejo de services/customers.ts) ─────────────────────────

const CUSTOMER_CHANNELS = ["email", "whatsapp"];
const NAMES = [
  ["Juan", "Pérez"], ["María", "González"], ["Carlos", "Ruiz"], ["Ana", "Martínez"],
  ["Pedro", "Sánchez"], ["Lucía", "Fernández"], ["Diego", "Torres"], ["Sofía", "Castro"],
  ["Martín", "López"], ["Valentina", "Moreno"], ["Julián", "Rojas"], ["Camila", "Silva"],
  ["Facundo", "Díaz"], ["Agustina", "Romero"], ["Nicolás", "Flores"], ["Florencia", "Álvarez"],
];
const CUSTOMER_STATUS = ["active", "active", "active", "inactive", "blocked"];

function getCustomers() {
  const rand = mulberry32(20260910);
  const today = new Date();

  return NAMES.map(([first, last], i) => {
    const created = new Date(today);
    created.setDate(created.getDate() - (20 + Math.floor(rand() * 300)));
    const reservations = Math.floor(rand() * 40);
    const cancellations = Math.floor(rand() * 5);
    const noShows = Math.floor(rand() * 3);
    const lastRes = new Date(today);
    lastRes.setDate(lastRes.getDate() - Math.floor(rand() * 20));
    const hour = 9 + Math.floor(rand() * 14);
    const status = CUSTOMER_STATUS[i % CUSTOMER_STATUS.length];

    return {
      customer_id: `cust-${100 + i}`,
      complex_id: "complex-demo",
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@mail.com`,
      phone: `+54911${String(50000000 + Math.floor(rand() * 49999999))}`,
      birth_date: null,
      status,
      notes: i % 5 === 0 ? "Cliente preferencial — prioridad en horarios pico." : null,
      preferred_contact_channel: CUSTOMER_CHANNELS[Math.floor(rand() * CUSTOMER_CHANNELS.length)],
      created_at: created.toISOString(),
      reservations_count: reservations,
      last_reservation_at: reservations > 0 ? lastRes.toISOString() : null,
      cancellations_count: cancellations,
      no_shows_count: noShows,
      total_spent: reservations * (14000 + Math.floor(rand() * 5000)),
      favorite_court_id: `c${1 + Math.floor(rand() * 4)}`,
      favorite_court_name: `Cancha ${1 + Math.floor(rand() * 4)}`,
      favorite_hour: hour,
    };
  });
}

function getCustomerHistory(customerId) {
  const rand = mulberry32(customerId.charCodeAt(5) * 1000 + 42);
  const today = new Date();
  const courts = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];
  const statuses = ["confirmed", "completed", "completed", "pending", "cancelled"];

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(rand() * 30));
    d.setHours(9 + Math.floor(rand() * 13), rand() > 0.5 ? 0 : 30, 0, 0);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + 60);
    const price = 14000 + Math.floor(rand() * 4000);
    const status = statuses[i % statuses.length];

    return {
      id: `res-${customerId}-${i}`,
      complex_id: "complex-demo",
      court_id: `c${1 + Math.floor(rand() * 4)}`,
      customer_id: customerId,
      series_id: null,
      occurrence_index: null,
      created_by: null,
      channel: "online",
      kind: "booking",
      status,
      starts_at: d.toISOString(),
      ends_at: end.toISOString(),
      price,
      currency: "ARS",
      deposit_amount: status !== "cancelled" ? Math.round(price * 0.5) : 0,
      paid_amount:
        status === "completed" ? price : status === "confirmed" ? Math.round(price * 0.5) : 0,
      promotion_id: null,
      title: null,
      notes: null,
      expires_at: null,
      cancelled_at: status === "cancelled" ? d.toISOString() : null,
      cancelled_by: null,
      cancel_reason: status === "cancelled" ? "Cancelada por el cliente" : null,
      import_job_id: null,
      import_row_id: null,
      created_at: d.toISOString(),
      updated_at: d.toISOString(),
      court_name: courts[Math.floor(rand() * courts.length)],
      customer_name: null,
      customer_email: null,
      customer_phone: null,
      has_approved_payment: status === "completed" || status === "confirmed",
    };
  });
}

// ── Calendario (espejo de services/calendar.ts) ────────────────────────

const DEMO_COURTS = [
  { id: "c1", name: "Cancha 1 —Techada", status: "active" },
  { id: "c2", name: "Cancha 2 —Techada", status: "active" },
  { id: "c3", name: "Cancha 3 —Cemento", status: "active" },
  { id: "c4", name: "Cancha 4 —Vidrio", status: "active" },
];

const DEMO_CAL_CUSTOMERS = [
  { id: "cu1", first_name: "Juan", last_name: "Pérez", email: "juan@mail.com", phone: "+5491155551" },
  { id: "cu2", first_name: "María", last_name: "González", email: "maria@mail.com", phone: "+5491155552" },
  { id: "cu3", first_name: "Carlos", last_name: "Ruiz", email: "carlos@mail.com", phone: "+5491155553" },
  { id: "cu4", first_name: "Ana", last_name: "Martínez", email: "ana@mail.com", phone: "+5491155554" },
  { id: "cu5", first_name: "Pedro", last_name: "Sánchez", email: "pedro@mail.com", phone: "+5491155555" },
  { id: "cu6", first_name: "Lucía", last_name: "Fernández", email: "lucia@mail.com", phone: "+5491155556" },
  { id: "cu7", first_name: "Diego", last_name: "Torres", email: "diego@mail.com", phone: "+5491155557" },
  { id: "cu8", first_name: "Sofía", last_name: "Castro", email: "sofia@mail.com", phone: "+5491155558" },
];

const PRICES = { c1: 16000, c2: 16000, c3: 14000, c4: 18000 };

function generateCalendarEvents(weekStart) {
  const rand = mulberry32(weekStart.getTime() % 100000);
  const events = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffset);
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const numEvents = isWeekend ? 6 + Math.floor(rand() * 4) : 3 + Math.floor(rand() * 3);

    for (let e = 0; e < numEvents; e++) {
      const courtIdx = Math.floor(rand() * DEMO_COURTS.length);
      const court = DEMO_COURTS[courtIdx];
      const hour = 9 + Math.floor(rand() * 13);
      const minute = rand() > 0.5 ? 0 : 30;
      const durationMin = 60 + Math.floor(rand() * 3) * 30;

      const start = new Date(day);
      start.setHours(hour, minute, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMin);

      const customer = DEMO_CAL_CUSTOMERS[Math.floor(rand() * DEMO_CAL_CUSTOMERS.length)];
      const price = PRICES[court.id] ?? 14000;
      const statuses = ["confirmed", "confirmed", "confirmed", "pending", "completed"];
      const status = statuses[Math.floor(rand() * statuses.length)];
      const paid = status === "completed" ? price : status === "confirmed" ? Math.round(price * 0.5) : 0;

      events.push({
        id: `demo-${dayOffset}-${e}-${court.id}`,
        court_id: court.id,
        customer_id: customer.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status,
        kind: "booking",
        price,
        currency: "ARS",
        paid_amount: paid,
        title: null,
        notes: null,
        expires_at: null,
        court_name: court.name,
        customer_name: `${customer.first_name} ${customer.last_name}`,
      });
    }
  }

  return events;
}

function generateCalendarSlots(courtId, date) {
  const slots = [];
  const d = new Date(date + "T09:00:00");
  const end = new Date(date + "T23:00:00");
  const rand = mulberry32(courtId.charCodeAt(1) * 100 + d.getDate());

  while (d < end) {
    const slotEnd = new Date(d);
    slotEnd.setMinutes(slotEnd.getMinutes() + 60);
    const isAvail = rand() > 0.35;
    slots.push({
      starts_at: d.toISOString(),
      ends_at: slotEnd.toISOString(),
      is_available: isAvail,
      reservation_id: isAvail ? null : `demo-res-${Math.floor(rand() * 9999)}`,
    });
    d.setMinutes(d.getMinutes() + 60);
  }
  return slots;
}

// ── Router ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clean = url.pathname.replace(/^\/api/, "") || "/";
  const method = req.method ?? "GET";
  const log = `${method} ${url.pathname}${url.search} -> `;

  const send = (body, status = 200) => {
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    res.end(JSON.stringify(body));
    console.log(`${log}${status} (${Date.now() - started}ms)`);
  };

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    res.end();
    return;
  }

  try {
    if (clean === "/health") return send({ ok: true, service: "sportmanager-mock-api", time: new Date().toISOString() });
    if (clean === "/demo/dashboard-data") return send(getDashboardData());

    if (clean === "/demo/customers") return send(getCustomers());

    const customerMatch = clean.match(/^\/demo\/customers\/([^/]+)\/history$/);
    if (customerMatch) return send(getCustomerHistory(customerMatch[1]));

    if (clean === "/demo/calendar/customers") return send(DEMO_CAL_CUSTOMERS);

    if (clean === "/demo/calendar/events") {
      const start = url.searchParams.get("start");
      const weekStart = start ? new Date(start) : new Date();
      return send({ events: generateCalendarEvents(weekStart), courts: DEMO_COURTS });
    }

    if (clean === "/demo/calendar/slots") {
      const courtId = url.searchParams.get("courtId") ?? "c1";
      const date = url.searchParams.get("date") ?? isoDay(new Date());
      return send(generateCalendarSlots(courtId, date));
    }

    return send({ error: `No existe el endpoint ${clean}` }, 404);
  } catch (error) {
    console.error(`${log} ERROR`, error);
    return send({ error: "Error interno del backend mock" }, 500);
  }
});

server.listen(PORT, () => {
  console.log("");
  console.log("SportManager/PlayHub - Mock API Backend");
  console.log(`Listening on http://localhost:${PORT}`);
  console.log("");
});