import { isDemoMode } from "@/lib/demo";
import { getDemoDashboard, type DashboardData } from "@/lib/demo-data";
import { fetchBackend, isBackendConfigured } from "@/lib/backend";
import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";

/**
 * KPIs del home del dashboard.
 * Demo: backend mock (:4000) si está disponible, si no datos locales.
 * Producción (Fase 4 real): rpc fn_complex_kpis + fn_occupancy_by_court
 * sobre el complejo activo del usuario.
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode()) {
    if (isBackendConfigured()) {
      const remote = await fetchBackend<DashboardData>("/demo/dashboard-data");
      if (remote) return remote;
    }
    return getDemoDashboard();
  }
  const scope = await getComplexScope();
  const supabase = await createClient();
  const { timezone } = scope;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 29);
  d30.setHours(0, 0, 0, 0);

  const fromISO = d30.toISOString().slice(0, 10);
  const toISO = now.toISOString().slice(0, 10);

  const [kpisRes, courtStatsRes, todayRes, courtsCountRes, newTodayRes] = await Promise.all([
    supabase.rpc("fn_complex_kpis", { p_complex_id: scope.complexId, p_from: fromISO, p_to: toISO }),
    supabase.rpc("fn_occupancy_by_court", { p_complex_id: scope.complexId, p_from: fromISO, p_to: toISO }),
    supabase
      .from("v_reservations_detail")
      .select("id,court_name,customer_name,starts_at,status,paid_amount,price")
      .eq("complex_id", scope.complexId)
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .order("starts_at", { ascending: true }),
    supabase.from("courts").select("id", { count: "exact", head: true }).eq("complex_id", scope.complexId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("complex_id", scope.complexId).gte("created_at", todayStart.toISOString()),
  ]);

  if (kpisRes.error) throw new Error(kpisRes.error.message);
  if (courtStatsRes.error) throw new Error(courtStatsRes.error.message);
  if (todayRes.error) throw new Error(todayRes.error.message);

  const kpis = kpisRes.data?.[0];
  const totalCourts = courtsCountRes.count ?? 0;
  const newCustomersToday = newTodayRes.count ?? 0;

  const todayRows = todayRes.data ?? [];
  const confirmedToday = todayRows.filter((r) => r.status === "confirmed" || r.status === "completed").length;
  const cancellationsToday = todayRows.filter((r) => r.status === "cancelled").length;
  const noShowsToday = todayRows.filter((r) => r.status === "no_show").length;

  const today: DashboardData["today"] = {
    reservationsToday: todayRows.length,
    confirmedToday,
    revenueToday: todayRows.reduce((s, r) => s + Number(r.price), 0),
    occupancyToday: kpis?.occupancy_pct != null ? Math.round(Number(kpis.occupancy_pct)) : 0,
    availableCourtsNow: totalCourts,
    totalCourts,
    cancellationsToday,
    noShowsToday,
    newCustomersToday,
  };

  const courts: DashboardData["courts"] = (courtStatsRes.data ?? []).map((c) => ({
    court: c.court_name,
    occupancy: Math.round(Number(c.occupancy_pct)),
    revenue: Number(c.revenue),
    reservations: Number(c.reservations_count),
  }));

  const peakHours: DashboardData["peakHours"] = [];
  const hourBuckets = new Map<number, number>();
  for (const row of todayRows) {
    const h = new Date(row.starts_at).getHours();
    hourBuckets.set(h, (hourBuckets.get(h) ?? 0) + 1);
  }
  for (const [h, demand] of hourBuckets) {
    peakHours.push({ hour: String(h).padStart(2, "0"), demand });
  }
  peakHours.sort((a, b) => Number(a.hour) - Number(b.hour));

  const todaySchedule: DashboardData["todaySchedule"] = todayRows.map((r) => ({
    id: r.id,
    time: new Date(r.starts_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: timezone }),
    court: r.court_name,
    customer: r.customer_name ?? "Sin cliente",
    status: r.status as DashboardData["todaySchedule"][number]["status"],
    paid: r.paid_amount > 0,
  }));

  const last30Days: DashboardData["last30Days"] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    last30Days.push({
      date: ds,
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      reservations: 0,
      revenue: 0,
      cancellations: 0,
      noShows: 0,
    });
  }

  return { today, last30Days, courts, peakHours, todaySchedule };
}
