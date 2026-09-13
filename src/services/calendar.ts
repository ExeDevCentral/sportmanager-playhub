import { isDemoMode } from "@/lib/demo";
import { fetchBackend, isBackendConfigured } from "@/lib/backend";
import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import { mulberry32 } from "@/lib/random";
import type { CalendarEvent, CalendarCourt, CalendarCustomer, Slot } from "@/lib/calendar-types";
import type { ReservationStatus, ReservationKind } from "@/types/database";
import type { ReservationFormValues } from "@/lib/validations/reservation";

// ── Demo data ──────────────────────────────────────────────────────────

const DEMO_COURTS: CalendarCourt[] = [
  { id: "c1", name: "Cancha 1 —Techada", status: "active" },
  { id: "c2", name: "Cancha 2 —Techada", status: "active" },
  { id: "c3", name: "Cancha 3 —Cemento", status: "active" },
  { id: "c4", name: "Cancha 4 —Vidrio", status: "active" },
];

const DEMO_CUSTOMERS: CalendarCustomer[] = [
  { id: "cu1", first_name: "Juan", last_name: "Pérez", email: "juan@mail.com", phone: "+5491155551" },
  { id: "cu2", first_name: "María", last_name: "González", email: "maria@mail.com", phone: "+5491155552" },
  { id: "cu3", first_name: "Carlos", last_name: "Ruiz", email: "carlos@mail.com", phone: "+5491155553" },
  { id: "cu4", first_name: "Ana", last_name: "Martínez", email: "ana@mail.com", phone: "+5491155554" },
  { id: "cu5", first_name: "Pedro", last_name: "Sánchez", email: "pedro@mail.com", phone: "+5491155555" },
  { id: "cu6", first_name: "Lucía", last_name: "Fernández", email: "lucia@mail.com", phone: "+5491155556" },
  { id: "cu7", first_name: "Diego", last_name: "Torres", email: "diego@mail.com", phone: "+5491155557" },
  { id: "cu8", first_name: "Sofía", last_name: "Castro", email: "sofia@mail.com", phone: "+5491155558" },
];

const PRICES: Record<string, number> = { c1: 16000, c2: 16000, c3: 14000, c4: 18000 };

function generateDemoEvents(weekStart: Date): CalendarEvent[] {
  const rand = mulberry32(weekStart.getTime() % 100000);
  const events: CalendarEvent[] = [];

  // Generate events for each day of the week (Mon-Sun)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffset);
    const dayOfWeek = day.getDay(); // 0=Sun, 1=Mon, ...
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const numEvents = isWeekend ? 6 + Math.floor(rand() * 4) : 3 + Math.floor(rand() * 3);

    for (let e = 0; e < numEvents; e++) {
      const courtIdx = Math.floor(rand() * DEMO_COURTS.length);
      const court = DEMO_COURTS[courtIdx]!;
      const hour = 9 + Math.floor(rand() * 13); // 09:00 - 21:00
      const minute = rand() > 0.5 ? 0 : 30;
      const durationMin = 60 + Math.floor(rand() * 3) * 30; // 60, 90, or 120 min

      const start = new Date(day);
      start.setHours(hour, minute, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMin);

      const customer = DEMO_CUSTOMERS[Math.floor(rand() * DEMO_CUSTOMERS.length)]!;
      const price = PRICES[court.id] ?? 14000;
      const statuses: ReservationStatus[] = ["confirmed", "confirmed", "confirmed", "pending", "completed"];
      const status = statuses[Math.floor(rand() * statuses.length)]!;
      const paid = status === "completed" ? price : status === "confirmed" ? Math.round(price * 0.5) : 0;

      events.push({
        id: `demo-${dayOffset}-${e}-${court.id}`,
        court_id: court.id,
        customer_id: customer.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status,
        kind: "booking" as ReservationKind,
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

function generateDemoSlots(courtId: string, date: string): Slot[] {
  const slots: Slot[] = [];
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

// ── Public API ─────────────────────────────────────────────────────────

export async function getCalendarEvents(
  weekStart: Date,
): Promise<{ events: CalendarEvent[]; courts: CalendarCourt[] }> {
  if (isDemoMode()) {
    if (isBackendConfigured()) {
      const remote = await fetchBackend<{ events: CalendarEvent[]; courts: CalendarCourt[] }>(
        `/demo/calendar/events?start=${encodeURIComponent(weekStart.toISOString())}`
      );
      if (remote) return remote;
    }
    return {
      events: generateDemoEvents(weekStart),
      courts: DEMO_COURTS,
    };
  }
  const scope = await getComplexScope();
  const supabase = await createClient();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [eventsRes, courtsRes] = await Promise.all([
    supabase
      .from("v_reservations_detail")
      .select("id,court_id,customer_id,starts_at,ends_at,status,kind,price,currency,paid_amount,title,notes,expires_at,court_name,customer_name")
      .eq("complex_id", scope.complexId)
      .gte("starts_at", weekStart.toISOString())
      .lte("ends_at", weekEnd.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("courts")
      .select("id,name,status")
      .eq("complex_id", scope.complexId)
      .order("position", { ascending: true }),
  ]);

  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (courtsRes.error) throw new Error(courtsRes.error.message);

  const events: CalendarEvent[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    court_id: e.court_id,
    customer_id: e.customer_id,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    status: e.status as ReservationStatus,
    kind: e.kind as ReservationKind,
    price: Number(e.price),
    currency: e.currency,
    paid_amount: Number(e.paid_amount),
    title: e.title,
    notes: e.notes,
    expires_at: e.expires_at,
    court_name: e.court_name,
    customer_name: e.customer_name,
  }));

  const courts: CalendarCourt[] = (courtsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status as CalendarCourt["status"],
  }));

  return { events, courts };
}

export async function getAvailableSlots(
  courtId: string,
  date: string,
): Promise<Slot[]> {
  if (isDemoMode()) {
    if (isBackendConfigured()) {
      const remote = await fetchBackend<Slot[]>(
        `/demo/calendar/slots?courtId=${encodeURIComponent(courtId)}&date=${encodeURIComponent(date)}`
      );
      if (remote) return remote;
    }
    return generateDemoSlots(courtId, date);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_available_slots", {
    p_court_id: courtId,
    p_date: date,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    is_available: s.is_available,
    reservation_id: s.reservation_id,
  }));
}

export async function getCustomers(
  _query?: string,
): Promise<CalendarCustomer[]> {
  if (isDemoMode()) {
    if (isBackendConfigured()) {
      const remote = await fetchBackend<CalendarCustomer[]>("/demo/calendar/customers");
      if (remote) return remote;
    }
    return DEMO_CUSTOMERS;
  }
  const scope = await getComplexScope();
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id,first_name,last_name,email,phone")
    .eq("complex_id", scope.complexId)
    .order("first_name", { ascending: true });

  if (_query) {
    const q = _query.trim();
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query.limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
  }));
}

export const DEMO_MODE_PREFIX = "Modo demo:";

export function isDemoModeError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(DEMO_MODE_PREFIX);
}

export async function createReservation(
  _data: ReservationFormValues,
): Promise<CalendarEvent> {
  if (isDemoMode()) {
    throw new Error(`${DEMO_MODE_PREFIX} la creación de reservas se simula localmente.`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("fn_create_reservation", {
    p_court_id: _data.court_id,
    p_starts_at: _data.starts_at,
    p_ends_at: _data.ends_at,
    p_customer_id: _data.customer_id,
    p_kind: _data.kind,
    p_channel: "admin",
    p_created_by: user?.id ?? null,
    p_title: _data.title,
    p_notes: _data.notes,
    p_hold: false,
  });
  if (error) throw new Error(error.message);

  const r = data!;
  return {
    id: r.id,
    court_id: r.court_id,
    customer_id: r.customer_id,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    status: r.status as ReservationStatus,
    kind: r.kind as ReservationKind,
    price: Number(r.price),
    currency: r.currency,
    paid_amount: Number(r.paid_amount),
    title: r.title,
    notes: r.notes,
    expires_at: r.expires_at,
    court_name: "",
    customer_name: null,
  };
}

export async function cancelReservation(
  _reservationId: string,
  _reason?: string,
): Promise<void> {
  if (isDemoMode()) {
    throw new Error("Modo demo: la cancelación se simula localmente.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cancel_reservation", {
    p_reservation_id: _reservationId,
    p_reason: _reason ?? null,
  });
  if (error) throw new Error(error.message);
}
