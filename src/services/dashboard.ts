import { isDemoMode } from "@/lib/demo";
import { getDemoDashboard, type DashboardData } from "@/lib/demo-data";
import { fetchBackend } from "@/lib/backend";

/**
 * KPIs del home del dashboard.
 * Demo: backend mock (:4000) si está disponible, si no datos locales.
 * Producción (Fase 4 real): rpc fn_complex_kpis + fn_occupancy_by_court
 * sobre el complejo activo del usuario.
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode()) {
    const remote = await fetchBackend<DashboardData>("/demo/dashboard-data");
    if (remote) return remote;
    return getDemoDashboard();
  }
  // TODO(Fase 4 real): conectar Supabase
  // const supabase = await createClient();
  // const { data } = await supabase.rpc("fn_complex_kpis", { p_complex_id, p_from, p_to });
  throw new Error("Supabase configurado pero el servicio real aún no está implementado (Fase 4).");
}
