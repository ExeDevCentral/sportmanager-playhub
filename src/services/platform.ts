import { isDemoMode } from "@/lib/demo";

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

export async function getPlatformOverview(): Promise<PlatformOverview> {
  if (!isDemoMode()) {
    // TODO(Fase 13 real): complexes + aggregates por complejo (fn_complejo_resumen)
    throw new Error("Supabase no implementado aún (vista plataforma).");
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