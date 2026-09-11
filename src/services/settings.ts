import { isDemoMode } from "@/lib/demo";
import type { CourtStatus, ComplexSettings } from "@/types/database";

export type SettingsData = {
  complexName: string;
  courts: CourtView[];
  operatingHours: OperatingHourView[];
  rates: RateView[];
  promotions: PromotionView[];
  settings: ComplexSettings;
};

export type CourtView = {
  id: string;
  name: string;
  description: string | null;
  surface: string | null;
  is_indoor: boolean;
  has_lighting: boolean;
  status: CourtStatus;
  is_public: boolean;
  position: number;
};

export type OperatingHourView = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

export type RateView = {
  id: string;
  court_id: string | null;
  name: string | null;
  day_of_week: number | null;
  starts_from: string | null;
  ends_to: string | null;
  price: number;
  is_active: boolean;
};

export type PromotionView = {
  id: string;
  name: string;
  description: string | null;
  discount_type: "percent" | "fixed" | "two_for_one" | "free_hours";
  discount_value: number | null;
  applies_days: number[] | null;
  valid_from: string;
  valid_to: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
};

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getDemoData(): SettingsData {
  const courts: CourtView[] = [
    { id: "c1", name: "Cancha 1", description: "Cancha principal, fija para eventos", surface: "Techada", is_indoor: true, has_lighting: true, status: "active", is_public: true, position: 1 },
    { id: "c2", name: "Cancha 2", description: null, surface: "Techada", is_indoor: true, has_lighting: true, status: "active", is_public: true, position: 2 },
    { id: "c3", name: "Cancha 3", description: "Aire libre, pared de cemento", surface: "Cemento", is_indoor: false, has_lighting: true, status: "maintenance", is_public: true, position: 3 },
    { id: "c4", name: "Cancha 4", description: null, surface: "Vidrio", is_indoor: true, has_lighting: true, status: "active", is_public: false, position: 4 },
  ];

  const operatingHours: OperatingHourView[] = [
    { day_of_week: 1, opens_at: "09:00", closes_at: "23:00", is_closed: false },
    { day_of_week: 2, opens_at: "09:00", closes_at: "23:00", is_closed: false },
    { day_of_week: 3, opens_at: "09:00", closes_at: "23:00", is_closed: false },
    { day_of_week: 4, opens_at: "09:00", closes_at: "23:00", is_closed: false },
    { day_of_week: 5, opens_at: "09:00", closes_at: "00:00", is_closed: false },
    { day_of_week: 6, opens_at: "10:00", closes_at: "00:00", is_closed: false },
    { day_of_week: 0, opens_at: "10:00", closes_at: "22:00", is_closed: false },
  ];

  const rates: RateView[] = [
    { id: "r1", court_id: "c1", name: "Horario normal", day_of_week: null, starts_from: "09:00", ends_to: "17:00", price: 14000, is_active: true },
    { id: "r2", court_id: "c1", name: "Horario pico", day_of_week: null, starts_from: "17:00", ends_to: "23:00", price: 18000, is_active: true },
    { id: "r3", court_id: "c3", name: "Tarifa exterior", day_of_week: null, starts_from: "09:00", ends_to: "23:00", price: 12000, is_active: true },
    { id: "r4", court_id: "c4", name: "Tarifa vidrio", day_of_week: null, starts_from: "09:00", ends_to: "23:00", price: 16000, is_active: true },
    { id: "r5", court_id: null, name: "Weekend surcharge", day_of_week: 6, starts_from: null, ends_to: null, price: 2000, is_active: true },
  ];

  const promotions: PromotionView[] = [
    { id: "p1", name: "Media mañana con descuento", description: "20% en turnos de 09:00 a 12:00", discount_type: "percent", discount_value: 20, applies_days: [1, 2, 3, 4, 5], valid_from: "2026-09-01", valid_to: "2026-12-31", max_uses: 200, used_count: 84, is_active: true, is_public: true },
    { id: "p2", name: "2x1 martes y miércoles", description: "Pagás uno, llevás dos", discount_type: "two_for_one", discount_value: null, applies_days: [2, 3], valid_from: "2026-09-01", valid_to: null, max_uses: null, used_count: 42, is_active: true, is_public: true },
    { id: "p3", name: "Pack mensual y padel + bar", description: "Descuento fijo de $5.000 en reservas después de las 20h", discount_type: "fixed", discount_value: 5000, applies_days: [5, 6, 0], valid_from: "2026-10-01", valid_to: null, max_uses: 50, used_count: 0, is_active: false, is_public: false },
  ];

  const settings: ComplexSettings = {
    complex_id: "complex-demo",
    slot_duration_minutes: 60,
    max_advance_days: 30,
    min_advance_minutes: 60,
    hold_minutes: 15,
    cancellation_deadline_hours: 24,
    allow_customer_cancellation: true,
    require_online_payment: true,
    deposit_mode: "percent",
    deposit_percent: 50,
    deposit_fixed: null,
    allow_guest_booking: false,
    reminder_24h_enabled: true,
    reminder_2h_enabled: true,
    publish_stats: true,
    publish_occupancy: true,
    publish_reservations_count: true,
    publish_court_stats: true,
    publish_history: true,
    publish_promotions: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { complexName: "Padel Club Palermo", courts, operatingHours, rates, promotions, settings };
}

export async function getSettingsData(): Promise<SettingsData> {
  if (isDemoMode()) {
    return getDemoData();
  }
  // TODO(Fase 4 real): query complexes, courts, operating_hours, rate_rules, promotions, complex_settings
  throw new Error("Supabase no implementado aún (Fase 4).");
}

export { DAY_NAMES };