import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { DataError } from "@/services/db";

export type ComplexOverview = {
  id: string;
  name: string;
  vertical: string;
  status: "operativo" | "configuracion" | "pausa";
  courts: number;
  owners: number;
  staff: number;
  reservations30d: number;
  revenue30d: number;
  occupancy: number;
  customers: number;
  plan: "starter" | "pro" | "enterprise";
};

export type PlatformOverview = {
  totalComplexes: number;
  totalCourts: number;
  totalCustomers: number;
  reservations30d: number;
  revenue30d: number;
  avgOccupancy: number;
  complexes: ComplexOverview[];
  trend: { month: string; reservations: number; revenue: number }[];
};

const DEMO_COMPLEXES: ComplexOverview[] = [
  { id: "cx-1", name: "SportManager Club", vertical: "Pádel", status: "operativo", courts: 4, owners: 1, staff: 3, reservations30d: 663, revenue30d: 4346000, occupancy: 74, customers: 182, plan: "pro" },
  { id: "cx-2", name: "Racket Center Norte", vertical: "Tenis + Pádel", status: "operativo", courts: 6, owners: 2, staff: 5, reservations30d: 921, revenue30d: 6180000, occupancy: 81, customers: 310, plan: "enterprise" },
  { id: "cx-3", name: "Aqua & Rugby Club", vertical: "Natación + Rugby", status: "configuracion", courts: 3, owners: 1, staff: 0, reservations30d: 0, revenue30d: 0, occupancy: 0, customers: 0, plan: "starter" },
  { id: "cx-4", name: "Futbol 5 Sur", vertical: "Fútbol", status: "operativo", courts: 6, owners: 1, staff: 2, reservations30d: 488, revenue30d: 3920000, occupancy: 68, customers: 145, plan: "pro" },
];

const DEMO_TREND: PlatformOverview["trend"] = [
  { month: "abr", reservations: 1820, revenue: 11200000 },
  { month: "may", reservations: 2090, revenue: 12900000 },
  { month: "jun", reservations: 1980, revenue: 12150000 },
  { month: "jul", reservations: 2410, revenue: 14480000 },
  { month: "ago", reservations: 2640, revenue: 16540000 },
];

const MONTHS: Record<number, string> = { 0: "ene", 1: "feb", 2: "mar", 3: "abr", 4: "may", 5: "jun", 6: "jul", 7: "ago", 8: "sep", 9: "oct", 10: "nov", 11: "dic" };

type ComplexRow = {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  timezone: string;
};

async function buildComplexOverview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  complex: ComplexRow
): Promise<ComplexOverview> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);

  const p_from = from.toISOString().slice(0, 10);
  const p_to = to.toISOString().slice(0, 10);

  const [kpisRes, courtsRes, membersRes, customersRes] = await Promise.all([
    supabase.rpc("fn_complex_kpis", { p_complex_id: complex.id, p_from, p_to }),
    supabase.from("courts").select("id", { count: "exact", head: true }).eq("complex_id", complex.id),
    supabase
      .from("complex_members")
      .select("role")
      .eq("complex_id", complex.id)
      .eq("is_active", true),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("complex_id", complex.id),
  ]);

  const kpis = kpisRes.data?.[0];
  const members = membersRes.data ?? [];
  const owners = members.filter((m) => m.role === "complex_owner").length;
  const staff = members.filter((m) => m.role === "complex_admin" || m.role === "staff").length;
  const total = kpis?.total_reservations != null ? Number(kpis.total_reservations) : 0;

  return {
    id: complex.id,
    name: complex.name,
    vertical: "Multi-deporte",
    status: complex.status === "suspended" ? "pausa" : total === 0 ? "configuracion" : "operativo",
    courts: courtsRes.count ?? 0,
    owners,
    staff,
    reservations30d: total,
    revenue30d: kpis?.revenue != null ? Number(kpis.revenue) : 0,
    occupancy: kpis?.occupancy_pct != null ? Math.round(Number(kpis.occupancy_pct)) : 0,
    customers: customersRes.count ?? 0,
    plan: total > 700 || members.length > 6 ? "enterprise" : total > 200 ? "pro" : "starter",
  };
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  if (!isDemoMode()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new DataError("Tu sesión expiró. Volvé a iniciar sesión.", "UNAUTHENTICATED");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.platform_role !== "platform_admin") {
      throw new DataError("Solo el administrador de la plataforma puede acceder a esta vista.", "FORBIDDEN");
    }

    const { data: complexes, error: cxErr } = await supabase
      .from("complexes")
      .select("id,name,status,timezone")
      .order("created_at", { ascending: true });
    if (cxErr) throw new Error(cxErr.message);

    const overviews = await Promise.all(
      (complexes ?? []).map((c) =>
        buildComplexOverview(
          supabase,
          { id: c.id, name: c.name, status: c.status, timezone: c.timezone }
        )
      )
    );

    const now = new Date();
    const trend: PlatformOverview["trend"] = [];
    for (let m = 4; m >= 0; m--) {
      const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      const p_from = start.toISOString().slice(0, 10);
      const p_to = end.toISOString().slice(0, 10);
      const kpis = await Promise.all(
        (complexes ?? []).map((c) =>
          supabase.rpc("fn_complex_kpis", { p_complex_id: c.id, p_from, p_to }).then((r) => r.data?.[0])
        )
      );
      trend.push({
        month: MONTHS[start.getMonth()] ?? "",
        reservations: kpis.reduce((s, k) => s + (k?.total_reservations ?? 0), 0),
        revenue: kpis.reduce((s, k) => s + Number(k?.revenue ?? 0), 0),
      });
    }

    const totals = overviews.reduce(
      (acc, c) => ({
        totalCourts: acc.totalCourts + c.courts,
        totalCustomers: acc.totalCustomers + c.customers,
        reservations30d: acc.reservations30d + c.reservations30d,
        revenue30d: acc.revenue30d + c.revenue30d,
      }),
      { totalCourts: 0, totalCustomers: 0, reservations30d: 0, revenue30d: 0 }
    );

    return {
      totalComplexes: overviews.length,
      ...totals,
      avgOccupancy: Math.round(
        overviews.reduce((s, c) => s + c.occupancy, 0) / (overviews.filter((c) => c.status === "operativo").length || 1)
      ),
      complexes: overviews,
      trend,
    };
  }
  const complexes = DEMO_COMPLEXES;
  return {
    totalComplexes: complexes.length,
    totalCourts: complexes.reduce((acc, c) => acc + c.courts, 0),
    totalCustomers: complexes.reduce((acc, c) => acc + c.customers, 0),
    reservations30d: complexes.reduce((acc, c) => acc + c.reservations30d, 0),
    revenue30d: complexes.reduce((acc, c) => acc + c.revenue30d, 0),
    avgOccupancy: Math.round(complexes.reduce((acc, c) => acc + c.occupancy, 0) / complexes.filter((c) => c.status === "operativo").length || 0),
    complexes,
    trend: DEMO_TREND,
  };
}