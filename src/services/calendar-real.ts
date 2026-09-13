import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarCourt, CalendarCustomer, Slot } from "@/lib/calendar-types";
import type { ReservationStatus, ReservationKind } from "@/types/database";
import type { ReservationFormValues } from "@/lib/validations/reservation";

/** Implementación real (Supabase) de getCalendarEvents. Server-only. */
export async function getCalendarEventsReal(
  weekStart: Date
): Promise<{ events: CalendarEvent[]; courts: CalendarCourt[] }> {
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

/** Implementación real de getAvailableSlots. Server-only. */
export async function getAvailableSlotsReal(courtId: string, date: string): Promise<Slot[]> {
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

/** Implementación real de getCustomers. Server-only. */
export async function getCustomersReal(query?: string): Promise<CalendarCustomer[]> {
  const scope = await getComplexScope();
  const supabase = await createClient();

  let q = supabase
    .from("customers")
    .select("id,first_name,last_name,email,phone")
    .eq("complex_id", scope.complexId)
    .order("first_name", { ascending: true });

  if (query) {
    const s = query.trim();
    q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data, error } = await q.limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
  }));
}

/** Implementación real de createReservation. Server-only. */
export async function createReservationReal(data: ReservationFormValues): Promise<CalendarEvent> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: r, error } = await supabase.rpc("fn_create_reservation", {
    p_court_id: data.court_id,
    p_starts_at: data.starts_at,
    p_ends_at: data.ends_at,
    p_customer_id: data.customer_id,
    p_kind: data.kind,
    p_channel: "admin",
    p_created_by: user?.id ?? null,
    p_title: data.title,
    p_notes: data.notes,
    p_hold: false,
  });
  if (error) throw new Error(error.message);

  return {
    id: r!.id,
    court_id: r!.court_id,
    customer_id: r!.customer_id,
    starts_at: r!.starts_at,
    ends_at: r!.ends_at,
    status: r!.status as ReservationStatus,
    kind: r!.kind as ReservationKind,
    price: Number(r!.price),
    currency: r!.currency,
    paid_amount: Number(r!.paid_amount),
    title: r!.title,
    notes: r!.notes,
    expires_at: r!.expires_at,
    court_name: "",
    customer_name: null,
  };
}

/** Implementación real de cancelReservation. Server-only. */
export async function cancelReservationReal(reservationId: string, reason?: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cancel_reservation", {
    p_reservation_id: reservationId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}