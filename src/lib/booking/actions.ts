"use server";

import { z } from "zod";
import { isDemoMode } from "@/lib/demo";
import { getSettingsData } from "@/services/settings";
import { buildSpaceSlots, computeSpaceSlots, type SpaceSlots } from "@/services/public";
import { getNotificationData } from "@/services/notifications";
import { renderTemplate, sendEmail, templateToHtml, wrapEmailHtml } from "@/services/mailer";

const bookingSchema = z.object({
  court_id: z.string().min(1, "Falta la cancha"),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00$/, "Turno inválido"),
  customer_name: z.string().trim().min(2, "Ingresá tu nombre completo").max(80),
  email: z.email("Email inválido"),
  phone: z.string().trim().min(6, "Teléfono inválido").max(24),
});

export type PublicBookingResult =
  | {
      ok: true;
      reference: string;
      court: string;
      date: string;
      time: string;
      price: number;
      status: "pending" | "confirmed";
      email: string;
      emailed: boolean;
    }
  | { ok: false; error: string };

function makeReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "SM-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function getSlotsForDate(dateKey: string): Promise<SpaceSlots[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return [];
  return buildSpaceSlots(dateKey);
}

export async function createPublicReservation(
  _prevState: PublicBookingResult | null,
  formData: FormData
): Promise<PublicBookingResult> {
  const parsed = bookingSchema.safeParse({
    court_id: String(formData.get("court_id") ?? ""),
    starts_at: String(formData.get("starts_at") ?? ""),
    customer_name: String(formData.get("customer_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  if (!isDemoMode()) {
    // TODO(Fase 11 real): verificar fn_available_slots(params) + INSERT reservations
    // + notification como anon guest; la regla de negocio vive en la BD.
    return { ok: false, error: "La reserva online real se habilita al conectar Supabase" };
  }

  const settings = await getSettingsData();
  const court = settings.courts.find((c) => c.id === input.court_id);
  if (!court || !court.is_public || court.status !== "active") {
    return { ok: false, error: "Ese espacio no acepta reservas online" };
  }

  const dateKey = input.starts_at.slice(0, 10);
  const slots = computeSpaceSlots(
    court.id,
    dateKey,
    settings.rates,
    settings.promotions,
    settings.settings.slot_duration_minutes,
    settings.settings.require_online_payment
  );
  const slot = slots.find((s) => s.starts_at === input.starts_at);
  if (!slot) return { ok: false, error: "Ese turno ya no existe" };
  if (!slot.is_available) return { ok: false, error: "Ese turno acaba de ocuparse. Elegí otro horario" };

  const minAdvance = settings.settings.min_advance_minutes;
  const startDate = new Date(input.starts_at);
  if (startDate.getTime() < Date.now() + minAdvance * 60_000) {
    return { ok: false, error: `Las reservas se toman con al menos ${minAdvance} minutos de anticipación` };
  }

  const reference = makeReference();
  const status: "pending" | "confirmed" = settings.settings.require_online_payment ? "pending" : "confirmed";
  const dateLabel = new Date(input.starts_at).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = input.starts_at.slice(11, 16);

  // Plantilla editable desde Notificaciones → booking_confirmation → email.
  let emailed = false;
  try {
    const { templates } = await getNotificationData();
    const tpl = templates.find((t) => t.key === "booking_confirmation" && t.channel === "email" && t.is_active);
    if (tpl) {
      const vars = {
        complex: settings.complexName,
        customer: input.customer_name,
        court: court.name,
        date: dateLabel,
        time: timeLabel,
        detail: `Turno ${timeLabel} — ${court.name} (${reference})`,
      };
      const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : `Tu reserva en ${settings.complexName}`;
      const html = wrapEmailHtml(subject, templateToHtml(renderTemplate(tpl.body, vars)), settings.complexName);
      const result = await sendEmail(input.email, subject, html);
      emailed = result.ok;
    }
  } catch {
    emailed = false;
  }

  return {
    ok: true,
    reference,
    court: court.name,
    date: dateLabel,
    time: timeLabel,
    price: slot.price,
    status,
    email: input.email,
    emailed,
  };
}