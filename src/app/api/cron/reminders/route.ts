import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { sendBookingNotification } from "@/lib/notifications/actions";

/** Cron (GET) de recordatorios: se dispara con un scheduler (Vercel cron, cron-job.org, etc.). */
export async function GET() {
  if (isDemoMode()) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.toISOString().slice(0, 10);
    const targets = [
      { email: "juan.perez@mail.com", customerName: "Juan Pérez", time: "10:00" },
      { email: "maria.gonzalez@mail.com", customerName: "María González", time: "18:00" },
      { email: "carlos.ruiz@mail.com", customerName: "Carlos Ruiz", time: "20:00" },
    ];
    const results = [];
    for (const t of targets) {
      const res = await sendBookingNotification({
        kind: "reminder",
        customerName: t.customerName,
        court: "Cancha 1",
        startsAt: `${day}T${t.time}:00:00`,
        email: t.email,
        reference: `SM-RM${t.time.replace(":", "")}`,
      });
      results.push({ email: t.email, ok: res.ok, status: res.status });
    }
    return NextResponse.json({
      ok: results.every((r) => r.ok),
      mode: "demo",
      sent: results.filter((r) => r.ok).length,
      total: results.length,
      results,
    });
  }
  // TODO(Fase 7 real): SELECT reservas a 24 h (status confirmed) → enqueue en notifications.
  return NextResponse.json({ ok: false, error: "Cron real pendiente de Supabase" }, { status: 501 });
}