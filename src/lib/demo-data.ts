// Datos demo deterministas (seed fija) para el modo sin Supabase.
// Cuando exista el proyecto real, services/dashboard.ts consulta
// fn_complex_kpis / fn_occupancy_by_court en lugar de este módulo.

export type DayKpi = {
  date: string; // ISO yyyy-mm-dd
  label: string; // "07/09"
  reservations: number;
  revenue: number;
  cancellations: number;
  noShows: number;
};

export type CourtStat = {
  court: string;
  occupancy: number;
  revenue: number;
  reservations: number;
  previousOccupancy?: number;
  capacityHours?: number;
};

export type PeakHour = {
  hour: string;
  demand: number;
};

export type ScheduleRow = {
  id: string;
  time: string;
  court: string;
  customer: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paid: boolean;
};

export type TodayKpis = {
  reservationsToday: number;
  confirmedToday: number;
  revenueToday: number;
  occupancyToday: number;
  availableCourtsNow: number;
  totalCourts: number;
  cancellationsToday: number;
  noShowsToday: number;
  newCustomersToday: number;
};

export type DashboardData = {
  today: TodayKpis;
  last30Days: DayKpi[];
  courts: CourtStat[];
  peakHours: PeakHour[];
  todaySchedule: ScheduleRow[];
};

/** PRNG con semilla fija: los números no cambian entre renders. */
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

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortLabel(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function getDemoDashboard(): DashboardData {
  const rand = mulberry32(20260907);
  const today = new Date();

  const last30Days: DayKpi[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    // tendencia levemente creciente + ruido + pico de fin de semana
    const trend = (29 - i) * 0.12;
    const base = 20 + trend + (isWeekend ? 9 : 0);
    const reservations = Math.round(base + rand() * 7 - 3);
    const avgPrice = 14000 + rand() * 4000;
    last30Days.push({
      date: isoDay(d),
      label: shortLabel(d),
      reservations,
      revenue: Math.round(reservations * avgPrice),
      cancellations: Math.round(rand() * 4),
      noShows: Math.round(rand() * 2),
    });
  }

  const todayEntry = last30Days[last30Days.length - 1]!;

  const todayKpis: TodayKpis = {
    reservationsToday: todayEntry.reservations,
    confirmedToday: Math.round(todayEntry.reservations * 0.86),
    revenueToday: todayEntry.revenue,
    occupancyToday: 78,
    availableCourtsNow: 3,
    totalCourts: 4,
    cancellationsToday: todayEntry.cancellations,
    noShowsToday: todayEntry.noShows,
    newCustomersToday: 2 + Math.round(rand() * 4),
  };

  const courts: CourtStat[] = [
    { court: "Cancha 1", occupancy: 82, previousOccupancy: 79, capacityHours: 300, revenue: 1240000, reservations: 184 },
    { court: "Cancha 2", occupancy: 74, previousOccupancy: 76, capacityHours: 300, revenue: 1105000, reservations: 169 },
    { court: "Cancha 3", occupancy: 69, previousOccupancy: 65, capacityHours: 300, revenue: 980000, reservations: 152 },
    { court: "Cancha 4", occupancy: 71, previousOccupancy: 70, capacityHours: 300, revenue: 1020000, reservations: 158 },
  ];

  const peakHours: PeakHour[] = [
    { hour: "09", demand: 12 },
    { hour: "10", demand: 15 },
    { hour: "11", demand: 14 },
    { hour: "12", demand: 10 },
    { hour: "17", demand: 28 },
    { hour: "18", demand: 41 },
    { hour: "19", demand: 47 },
    { hour: "20", demand: 44 },
    { hour: "21", demand: 36 },
    { hour: "22", demand: 21 },
  ];

  const customers = [
    "Juan Pérez",
    "María González",
    "Carlos Ruiz",
    "Ana Martínez",
    "Pedro Sánchez",
    "Lucía Fernández",
    "Diego Torres",
    "Sofía Castro",
  ];
  const statuses: ScheduleRow["status"][] = ["confirmed", "confirmed", "pending", "confirmed", "cancelled"];
  const todaySchedule: ScheduleRow[] = Array.from({ length: 8 }, (_, i) => {
    const hour = 15 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return {
      id: `demo-${i}`,
      time: `${hour}:${minute}`,
      court: `Cancha ${(i % 4) + 1}`,
      customer: customers[i % customers.length]!,
      status: statuses[i % statuses.length]!,
      paid: i % 5 !== 2,
    };
  });

  return {
    today: todayKpis,
    last30Days,
    courts,
    peakHours,
    todaySchedule,
  };
}
