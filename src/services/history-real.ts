import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
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

/** Implementación real (Supabase) de getReservationHistory. Server-only. */
export async function getReservationHistoryReal(): Promise<HistoryRecord[]> {
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