import { isDemoMode } from "@/lib/demo";
import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
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

  const scope = await getComplexScope();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_reservations_detail")
    .select("id,customer_name,court_name,starts_at,price,paid_amount,status,channel,kind")
    .eq("complex_id", scope.complexId)
    .order("starts_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    customer_name: r.customer_name ?? "Sin nombre",
    court_name: r.court_name,
    starts_at: r.starts_at,
    price: Number(r.price),
    paid_amount: Number(r.paid_amount),
    status: r.status as ReservationStatus,
    channel: (r.channel === "import" ? "import" : r.channel === "admin" ? "manual" : "online") as HistoryRecord["channel"],
    is_booked: r.status !== "cancelled" && r.status !== "no_show",
  }));
}

export const HISTORY_STATUS_LABEL: Partial<Record<ReservationStatus, string>> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
  expired: "Expirada",
  refunded: "Reembolsada",
};