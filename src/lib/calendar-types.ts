import type { Reservation, Court, Customer } from "@/types/database";

/** Evento enriquecido para el calendario (extendido con nombres de cancha/cliente). */
export type CalendarEvent = Pick<
  Reservation,
  "id" | "court_id" | "customer_id" | "starts_at" | "ends_at" | "status" | "kind" | "price" | "currency" | "paid_amount" | "title" | "notes" | "expires_at"
> & {
  court_name: string;
  customer_name: string | null;
};

/** Día del calendario (columna). */
export type CalendarDay = {
  date: string; // ISO yyyy-mm-dd
  label: string; // "Lun 07/09"
  dayShort: string; // "Lun"
  dayNum: string; // "07"
  monthShort: string; // "Sep"
};

/** Cancha para el grid. */
export type CalendarCourt = Pick<Court, "id" | "name" | "status">;

/** Cliente para autocomplete en el dialog. */
export type CalendarCustomer = Pick<Customer, "id" | "first_name" | "last_name" | "email" | "phone">;

/** Slot disponible (devuelto por fn_available_slots). */
export type Slot = {
  starts_at: string; // ISO datetime
  ends_at: string;
  is_available: boolean;
  reservation_id: string | null;
};

/** Datos para el dialog de creación/edición. */
export type ReservationFormData = {
  court_id: string;
  customer_id: string | null;
  starts_at: string; // ISO datetime
  ends_at: string;
  kind: "booking" | "block" | "maintenance" | "event";
  title: string | null;
  notes: string | null;
};

/** Bloqueo temporal de una cancha. */
export type CourtBlock = {
  id: string;
  court_id: string;
  starts_at: string;
  ends_at: string;
  title: string;
};
