import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import type { CourtStatus, ComplexSettings } from "@/types/database";
import type {
  CourtView,
  OperatingHourView,
  RateView,
  PromotionView,
  SettingsData,
} from "@/services/settings";

/** Strip "HH:MM:SS" → "HH:MM" for display types. */
function fmtTime(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t;
}

/** Implementación real (Supabase) de getSettingsData. Server-only. */
export async function getSettingsDataReal(): Promise<SettingsData> {
  const scope = await getComplexScope();
  const supabase = await createClient();

  const [courtsRes, hoursRes, ratesRes, promosRes, settingsRes] = await Promise.all([
    supabase
      .from("courts")
      .select("id,name,description,surface,is_indoor,has_lighting,status,is_public,position")
      .eq("complex_id", scope.complexId)
      .order("position", { ascending: true }),
    supabase
      .from("operating_hours")
      .select("day_of_week,opens_at,closes_at,is_closed")
      .eq("complex_id", scope.complexId)
      .order("day_of_week", { ascending: true }),
    supabase
      .from("rate_rules")
      .select("id,court_id,name,day_of_week,starts_from,ends_to,price,is_active")
      .eq("complex_id", scope.complexId)
      .eq("is_active", true)
      .order("priority", { ascending: false }),
    supabase
      .from("promotions")
      .select("id,name,description,discount_type,discount_value,applies_days,valid_from,valid_to,max_uses,used_count,is_active,is_public")
      .eq("complex_id", scope.complexId)
      .order("valid_from", { ascending: false }),
    supabase
      .from("complex_settings")
      .select("*")
      .eq("complex_id", scope.complexId)
      .maybeSingle(),
  ]);

  if (courtsRes.error) throw new Error(courtsRes.error.message);
  if (hoursRes.error) throw new Error(hoursRes.error.message);
  if (ratesRes.error) throw new Error(ratesRes.error.message);
  if (promosRes.error) throw new Error(promosRes.error.message);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  const courts: CourtView[] = (courtsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    surface: c.surface,
    is_indoor: c.is_indoor,
    has_lighting: c.has_lighting,
    status: c.status as CourtStatus,
    is_public: c.is_public,
    position: c.position ?? 0,
  }));

  const operatingHours: OperatingHourView[] = (hoursRes.data ?? []).map((h) => ({
    day_of_week: h.day_of_week,
    opens_at: fmtTime(h.opens_at),
    closes_at: fmtTime(h.closes_at),
    is_closed: h.is_closed,
  }));

  const rates: RateView[] = (ratesRes.data ?? []).map((r) => ({
    id: r.id,
    court_id: r.court_id,
    name: r.name,
    day_of_week: r.day_of_week,
    starts_from: r.starts_from ? fmtTime(r.starts_from) : null,
    ends_to: r.ends_to ? fmtTime(r.ends_to) : null,
    price: Number(r.price),
    is_active: r.is_active,
  }));

  const promotions: PromotionView[] = (promosRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    discount_type: p.discount_type as PromotionView["discount_type"],
    discount_value: p.discount_value != null ? Number(p.discount_value) : null,
    applies_days: p.applies_days as number[] | null,
    valid_from: p.valid_from,
    valid_to: p.valid_to,
    max_uses: p.max_uses,
    used_count: p.used_count,
    is_active: p.is_active,
    is_public: p.is_public,
  }));

  const settings = settingsRes.data as ComplexSettings;

  return { complexName: scope.complexName, courts, operatingHours, rates, promotions, settings };
}