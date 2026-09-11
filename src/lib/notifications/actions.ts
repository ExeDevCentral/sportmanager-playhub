"use server";

import { isDemoMode } from "@/lib/demo";
import { getSettingsData } from "@/services/settings";
import { getNotificationData } from "@/services/notifications";
import { sendEmail, renderTemplate, templateToHtml, wrapEmailHtml, type EmailResult } from "@/services/mailer";

export type BookingEventKind = "confirmed" | "cancelled" | "paid" | "reminder";

const TEMPLATE_BY_KIND: Record<BookingEventKind, string> = {
  confirmed: "booking_confirmation",
  paid: "booking_confirmation",
  cancelled: "booking_cancellation",
  reminder: "booking_reminder",
};

export type BookingNotificationInput = {
  kind: BookingEventKind;
  customerName: string;
  court: string;
  startsAt: string;
  email: string;
  reference?: string;
};

export type BookingNotificationResult = {
  ok: boolean;
  provider: EmailResult["provider"];
  status: "sent" | "failed" | "no_template";
  error?: string;
};

/** Dispara el email de un evento de reserva usando la plantilla activa de Notificaciones. */
export async function sendBookingNotification(input: BookingNotificationInput): Promise<BookingNotificationResult> {
  const { kind, customerName, court, email } = input;
  const settings = await getSettingsData();
  const complex = settings.complexName;

  const dateLabel = new Date(input.startsAt).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = new Date(input.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

  const { templates } = await getNotificationData();
  const tpl = templates.find((t) => t.key === TEMPLATE_BY_KIND[kind] && t.channel === "email" && t.is_active);
  if (!tpl) return { ok: false, provider: isDemoMode() ? "demo" : "resend", status: "no_template" };

  const vars: Record<string, string> = {
    complex,
    customer: customerName,
    court,
    date: dateLabel,
    time: timeLabel,
    detail:
      kind === "paid"
        ? `Pago acreditado para ${court} · ${dateLabel} ${timeLabel}` +
          (input.reference ? ` (${input.reference})` : "")
        : `Turno ${timeLabel} — ${court}` + (input.reference ? ` (${input.reference})` : ""),
  };

  const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : `Tu reserva en ${complex}`;
  const html = wrapEmailHtml(subject, templateToHtml(renderTemplate(tpl.body, vars)), complex);
  const result = await sendEmail(email, subject, html);

  if (result.ok) return { ok: true, provider: result.provider, status: "sent" };
  return { ok: false, provider: result.provider, status: "failed", error: result.error };
}

/** Email de prueba desde Notificaciones → usa la plantilla de confirmación. */
export async function sendTestEmail(
  _prevState: BookingNotificationResult | null,
  formData: FormData
): Promise<BookingNotificationResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { ok: false, provider: isDemoMode() ? "demo" : "resend", status: "failed", error: "Email inválido" };
  }
  const settings = await getSettingsData();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const startsAt = `${tomorrow.toISOString().slice(0, 10)}T19:00:00`;
  const court = settings.courts.find((c) => c.is_public)?.name ?? "Cancha 1";
  const templateKey = String(formData.get("template_key") ?? "booking_reminder");
  const { templates } = await getNotificationData();
  const template = templates.find(
    (item) => item.key === templateKey && item.channel === "email" && item.is_active,
  );
  if (!template) {
    return {
      ok: false,
      provider: isDemoMode() ? "demo" : "resend",
      status: "no_template",
      error: "Seleccioná una plantilla de email activa",
    };
  }

  const dateLabel = new Date(startsAt).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = "19:00";
  const vars = {
    complex: settings.complexName,
    customer: "Cliente de prueba",
    court,
    date: dateLabel,
    time: timeLabel,
    detail: `Turno ${timeLabel} — ${court} (SM-TEST00)`,
  };
  const subject = template.subject
    ? renderTemplate(template.subject, vars)
    : `Prueba de plantilla · ${settings.complexName}`;
  const html = wrapEmailHtml(
    subject,
    templateToHtml(renderTemplate(template.body, vars)),
    settings.complexName,
  );
  const result = await sendEmail(email, subject, html);
  return result.ok
    ? { ok: true, provider: result.provider, status: "sent" }
    : { ok: false, provider: result.provider, status: "failed", error: result.error };
}