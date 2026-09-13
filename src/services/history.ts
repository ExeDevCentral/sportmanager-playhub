import { isDemoMode } from "@/lib/demo";
import { mulberry32 } from "@/lib/random";
import type { ReservationStatus } from "@/types/database";

export type HistoryRecord = {
  id: string;
  customer_name: string;
  court_name: string;
  starts_at: string;
  price: number;
  paid_amount: number;
  status: ReservationStatus;
  channel: "online" | "manual" | "import";
  is_booked: boolean;
};

const DEMO_NAMES = [
  "Juan Pérez", "María González", "Carlos Ruiz", "Ana Martínez", "Pedro Sánchez",
  "Lucía Fernández", "Diego Torres", "Sofía Castro", "Martín López", "Valentina Moreno",
  "Julián Rojas", "Camila Silva", "Facundo Díaz", "Agustina Romero", "Nicolás Flores",
  "Florencia Álvarez",
];

const DEMO_COURTS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

function getDemoHistory(): HistoryRecord[] {
  const rand = mulberry32(20260911);
  const today = new Date();
  const statuses: ReservationStatus[] = [
    "completed", "completed", "completed", "completed", "confirmed", "cancelled", "no_show",
  ];

  const records: HistoryRecord[] = Array.from({ length: 48 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(rand() * 60));
    d.setHours(9 + Math.floor(rand() * 13), rand() > 0.5 ? 0 : 30, 0, 0);

    const price = (14000 + Math.floor(rand() * 4000)) * 1000 / 1000;
    const status = statuses[Math.floor(rand() * statuses.length)]!;
    const roll = rand();
    const paid = status === "completed"
      ? price
      : status === "confirmed"
        ? Math.round(price * 0.5)
        : status === "no_show"
          ? Math.round(price * (0.5 + rand() * 0.5) / 100) * 100
          : 0;

    return {
      id: `hist-${1000 + i}`,
      customer_name: DEMO_NAMES[Math.floor(rand() * DEMO_NAMES.length)]!,
      court_name: DEMO_COURTS[Math.floor(rand() * DEMO_COURTS.length)]!,
      starts_at: d.toISOString(),
      price,
      paid_amount: paid,
      status,
      channel: (roll < 0.22 ? "import" : roll < 0.42 ? "manual" : "online") as HistoryRecord["channel"],
      is_booked: status !== "cancelled" && status !== "no_show",
    };
  }).sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return records;
}

export async function getReservationHistory(): Promise<HistoryRecord[]> {
  if (isDemoMode()) {
    return getDemoHistory();
  }
  // La implementación real vive en history-real.ts (server-only) para no
  // arrastrar cookies()/RLS al bundle de los client components.
  return (await import("@/services/history-real")).getReservationHistoryReal();
}

export { HISTORY_STATUS_LABEL } from "@/services/labels";