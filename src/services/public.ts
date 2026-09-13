import { isDemoMode } from "@/lib/demo";
import { getSettingsData } from "@/services/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RateView, PromotionView } from "@/services/settings";

export type { RateView, PromotionView };

export type PublicSpace = {
  id: string;
  name: string;
  surface: string | null;
  is_indoor: boolean;
  has_lighting: boolean;
  description: string | null;
};

export type PublicSlot = {
  starts_at: string; // ISO local
  ends_at: string;
  price: number;
  original_price: number;
  promo_label: string | null;
  is_available: boolean;
};

export type SpaceSlots = {
  id: string;
  name: string;
  surface: string | null;
  is_indoor: boolean;
  has_lighting: boolean;
  description: string | null;
  slots: PublicSlot[];
};

export type PublicBookingData = {
  complexName: string;
  slots: SpaceSlots[];
  promotions: PromotionView[];
  slotDuration: number;
  maxAdvanceDays: number;
  minAdvanceMinutes: number;
  requireOnlinePayment: boolean;
};

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

function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

function basePriceFor(spaceId: string, hour: number, dow: number, rates: RateView[]): number {
  const byCourt = rates.filter((r) => r.court_id === spaceId && r.is_active);
  const match = byCourt.find(
    (r) =>
      r.starts_from !== null &&
      r.ends_to !== null &&
      hour >= Number(r.starts_from.slice(0, 2)) &&
      hour < Number(r.ends_to.slice(0, 2))
  );
  let price = match?.price ?? 14000;
  const surcharge = rates.find((r) => r.court_id === null && r.day_of_week === dow && r.is_active);
  if (surcharge) price += surcharge.price;
  return price;
}

function applyPromotion(
  price: number,
  dow: number,
  dateKey: string,
  promotions: PromotionView[]
): { price: number; label: string | null } {
  let best = price;
  let bestPromo: PromotionView | null = null;
  for (const p of promotions) {
    if (!p.is_active || !p.is_public) continue;
    if (p.valid_from && dateKey < p.valid_from) continue;
    if (p.valid_to && dateKey > p.valid_to) continue;
    if (p.max_uses != null && p.used_count >= p.max_uses) continue;
    if (p.applies_days && !p.applies_days.includes(dow)) continue;
    let candidate: number | null = null;
    if (p.discount_type === "percent" && (p.discount_value ?? 0) > 0) {
      candidate = price * (1 - (p.discount_value ?? 0) / 100);
    } else if (p.discount_type === "fixed" && (p.discount_value ?? 0) > 0) {
      candidate = Math.max(0, price - (p.discount_value ?? 0));
    } else if (p.discount_type === "two_for_one") {
      candidate = price / 2;
    }
    if (candidate !== null && candidate < best) {
      best = candidate;
      bestPromo = p;
    }
  }
  return { price: Math.round(best), label: bestPromo ? bestPromo.name : null };
}

export function computeSpaceSlots(
  spaceId: string,
  dateKey: string,
  rates: RateView[],
  promotions: PromotionView[],
  slotDuration: number,
  requireOnlinePayment: boolean
): PublicSlot[] {
  const dow = new Date(`${dateKey}T12:00:00`).getDay();
  const rand = mulberry32(hashSeed(dateKey, spaceId));
  const open = 9;
  const close = 23;

  const slots: PublicSlot[] = [];
  for (let h = open; h < close; h += slotDuration / 60) {
    const endsHour = h + slotDuration / 60;
    const starts_at = `${dateKey}T${String(h).padStart(2, "0")}:00:00`;
    const ends_at = `${dateKey}T${String(endsHour).padStart(2, "0")}:00:00`;

    const randVal = rand();
    // ~6 de cada 10 turnos quedan disponibles (fijos por cancha+fecha+horario).
    let is_available = randVal > 0.28 && randVal < 0.9;
    if (requireOnlinePayment && randVal > 0.36 && randVal < 0.46) is_available = false;

    const original_price = basePriceFor(spaceId, h, dow, rates);
    const { price, label } = applyPromotion(original_price, dow, dateKey, promotions);
    slots.push({ starts_at, ends_at, price, original_price, promo_label: label, is_available });
  }
  return slots;
}

export function nextBookingDays(maxAdvanceDays: number, maxDays = 14): { date: string; weekday: string; day: string; month: string }[] {
  const out: { date: string; weekday: string; day: string; month: string }[] = [];
  const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const now = new Date();
  for (let i = 0; i < Math.min(maxDays, maxAdvanceDays); i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      weekday: WEEKDAYS[d.getDay()]!,
      day: String(d.getDate()),
      month: MONTHS[d.getMonth()]!,
    });
  }
  return out;
}

export async function buildSpaceSlots(dateKey: string): Promise<SpaceSlots[]> {
  const settings = await getSettingsData();
  const spaces = settings.courts
    .filter((c) => c.is_public && c.status === "active")
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, name: c.name, surface: c.surface, is_indoor: c.is_indoor, has_lighting: c.has_lighting, description: c.description }));
  const slotDuration = settings.settings.slot_duration_minutes;
  return spaces.map((s) => ({
    ...s,
    slots: computeSpaceSlots(s.id, dateKey, settings.rates, settings.promotions, slotDuration, settings.settings.require_online_payment),
  }));
}

/** Strip "HH:MM:SS" → "HH:MM". */
function fmtTime(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t;
}

export async function getPublicBookingData(dateKey: string): Promise<PublicBookingData> {
  if (isDemoMode()) {
    const settings = await getSettingsData();
    return {
      complexName: settings.complexName,
      slots: await buildSpaceSlots(dateKey),
      promotions: settings.promotions.filter((p) => p.is_active && p.is_public),
      slotDuration: settings.settings.slot_duration_minutes,
      maxAdvanceDays: settings.settings.max_advance_days,
      minAdvanceMinutes: settings.settings.min_advance_minutes,
      requireOnlinePayment: settings.settings.require_online_payment,
    };
  }

  const admin = createAdminClient();

  const { data: complex, error: cxErr } = await admin
    .from("complexes")
    .select("id,name")
    .eq("public_site_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (cxErr) throw new Error(cxErr.message);
  if (!complex) throw new Error("No hay complejos públicos configurados.");

  const cid = complex.id;

  const [courtsRes, ratesRes, promosRes, settingsRes] = await Promise.all([
    admin
      .from("courts")
      .select("id,name,surface,is_indoor,has_lighting,description")
      .eq("complex_id", cid)
      .eq("is_public", true)
      .eq("status", "active")
      .order("position", { ascending: true }),
    admin
      .from("rate_rules")
      .select("id,court_id,name,day_of_week,starts_from,ends_to,price,is_active")
      .eq("complex_id", cid)
      .eq("is_active", true),
    admin
      .from("promotions")
      .select("id,name,description,discount_type,discount_value,applies_days,valid_from,valid_to,max_uses,used_count,is_active,is_public")
      .eq("complex_id", cid)
      .eq("is_active", true)
      .eq("is_public", true),
    admin
      .from("complex_settings")
      .select("slot_duration_minutes,max_advance_days,min_advance_minutes,require_online_payment")
      .eq("complex_id", cid)
      .maybeSingle(),
  ]);

  if (courtsRes.error) throw new Error(courtsRes.error.message);
  if (ratesRes.error) throw new Error(ratesRes.error.message);
  if (promosRes.error) throw new Error(promosRes.error.message);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  const cs = settingsRes.data;
  const slotDuration = cs?.slot_duration_minutes ?? 60;
  const maxAdvanceDays = cs?.max_advance_days ?? 30;
  const minAdvanceMinutes = cs?.min_advance_minutes ?? 60;
  const requireOnlinePayment = cs?.require_online_payment ?? true;

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

  const spaces: SpaceSlots[] = (courtsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    surface: c.surface,
    is_indoor: c.is_indoor,
    has_lighting: c.has_lighting,
    description: c.description,
    slots: computeSpaceSlots(c.id, dateKey, rates, promotions, slotDuration, requireOnlinePayment),
  }));

  return {
    complexName: complex.name,
    slots: spaces,
    promotions,
    slotDuration,
    maxAdvanceDays,
    minAdvanceMinutes,
    requireOnlinePayment,
  };
}