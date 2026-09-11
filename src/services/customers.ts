import { isDemoMode } from "@/lib/demo";
import { fetchBackend } from "@/lib/backend";
import type { CustomerStats, CustomerStatus, NotificationChannel } from "@/types/database";
import type { ReservationDetail } from "@/types/database";

const CHANNELS: NotificationChannel[] = ["email", "whatsapp"];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES: [string, string][] = [
  ["Juan", "Pérez"], ["María", "González"], ["Carlos", "Ruiz"], ["Ana", "Martínez"],
  ["Pedro", "Sánchez"], ["Lucía", "Fernández"], ["Diego", "Torres"], ["Sofía", "Castro"],
  ["Martín", "López"], ["Valentina", "Moreno"], ["Julián", "Rojas"], ["Camila", "Silva"],
  ["Facundo", "Díaz"], ["Agustina", "Romero"], ["Nicolás", "Flores"], ["Florencia", "Álvarez"],
];

const STATUS: CustomerStatus[] = ["active", "active", "active", "inactive", "blocked"];

function getDemoCustomers(): CustomerStats[] {
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
    const status = STATUS[i % STATUS.length]!;

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
      preferred_contact_channel: CHANNELS[Math.floor(rand() * CHANNELS.length)]!,
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

function getDemoHistory(customerId: string): ReservationDetail[] {
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
    const status = statuses[i % statuses.length]! as ReservationDetail["status"];

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
      paid_amount: status === "completed" ? price : status === "confirmed" ? Math.round(price * 0.5) : 0,
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
      court_name: courts[Math.floor(rand() * courts.length)]!,
      customer_name: null,
      customer_email: null,
      customer_phone: null,
      has_approved_payment: status === "completed" || status === "confirmed",
    };
  });
}

export async function getCustomers(): Promise<CustomerStats[]> {
  if (isDemoMode()) {
    const remote = await fetchBackend<CustomerStats[]>("/demo/customers");
    if (remote) return remote;
    return getDemoCustomers();
  }
  // TODO(Fase 8 real): query v_customer_stats
  throw new Error("Supabase no implementado aún (Fase 8).");
}

export async function getCustomerHistory(customerId: string): Promise<ReservationDetail[]> {
  if (isDemoMode()) {
    const remote = await fetchBackend<ReservationDetail[]>(
      `/demo/customers/${encodeURIComponent(customerId)}/history`
    );
    if (remote) return remote;
    return getDemoHistory(customerId);
  }
  // TODO(Fase 8 real): query v_reservations_detail
  throw new Error("Supabase no implementado aún (Fase 8).");
}