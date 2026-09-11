import { createClient } from "@/lib/supabase/server";

/**
 * Errores de capa de datos con mensaje legible para el usuario.
 */
export class DataError extends Error {
  code: string;
  constructor(message: string, code = "DATABASE") {
    super(message);
    this.name = "DataError";
    this.code = code;
  }
}

/** Complejo activo del usuario autenticado + datos esenciales para reportes en tz/currency. */
export type ComplexScope = {
  complexId: string;
  complexName: string;
  timezone: string;
  currency: string;
};

/**
 * Resuelve el complejo activo del usuario (primera membresía activa).
 * - Platform admin no tiene complejo: lanza DataError con code PLATFORM_SCOPE.
 * - Usuario sin membresía: lanza DataError con mensaje de invitación.
 */
export async function getComplexScope(): Promise<ComplexScope> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new DataError("Tu sesión expiró. Volvé a iniciar sesión.", "UNAUTHENTICATED");

  const { data: member, error: memberError } = await supabase
    .from("complex_members")
    .select("complex_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (memberError) throw new DataError(memberError.message, memberError.code);

  if (!member) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.platform_role === "platform_admin") {
      throw new DataError("PLATFORM_SCOPE", "PLATFORM_SCOPE");
    }
    throw new DataError(
      "Tu usuario todavía no pertenece a ningún complejo. Un admin tiene que invitarte (complex_members).",
      "NO_COMPLEX"
    );
  }

  const { data: complex, error: complexError } = await supabase
    .from("complexes")
    .select("name, timezone, currency")
    .eq("id", member.complex_id)
    .maybeSingle();
  if (complexError) throw new DataError(complexError.message, complexError.code);
  if (!complex) throw new DataError("El complejo asociado a tu usuario no se encuentra.", "COMPLEX_NOT_FOUND");

  return {
    complexId: member.complex_id,
    complexName: complex.name,
    timezone: complex.timezone,
    currency: complex.currency,
  };
}

// ── Helpers de fecha en timezone del complejo ─────────────────────────

/** "YYYY-MM-DD" local (timezone) de un instante ISO. */
export function tzDate(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** "YYYY-MM-DDTHH:MM:00" local (timezone) de un instante ISO. */
export function tzSlotKey(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Hora local (0-23) de un instante ISO en la timezone. */
export function tzHour(iso: string, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" }).format(
      new Date(iso)
    )
  );
}

/** Instante ISO de la medianoche local de una fecha en la timezone. */
export function tzLocalMidnightISO(date: Date, timezone: string): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const tzName =
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const sign = tzName.startsWith("GMT-") ? -1 : 1;
  const [h = "0", m = "0"] = tzName.replace(/^GMT[+-]/, "").split(":");
  const offsetMin = sign * (Number(h) * 60 + Number(m));
  return new Date(
    Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10))) -
      offsetMin * 60_000
  ).toISOString();
}