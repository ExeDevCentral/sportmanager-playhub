import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import type { CustomerStats } from "@/types/database";
import type { ReservationDetail } from "@/types/database";

/** Implementación real (Supabase) de getCustomers. Server-only. */
export async function getCustomersReal(): Promise<CustomerStats[]> {
  const scope = await getComplexScope();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_customer_stats")
    .select("*")
    .eq("complex_id", scope.complexId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    ...c,
    reservations_count: Number(c.reservations_count),
    cancellations_count: Number(c.cancellations_count),
    no_shows_count: Number(c.no_shows_count),
    total_spent: Number(c.total_spent),
    favorite_hour: c.favorite_hour != null ? Number(c.favorite_hour) : null,
  }));
}

/** Implementación real (Supabase) de getCustomerHistory. Server-only. */
export async function getCustomerHistoryReal(customerId: string): Promise<ReservationDetail[]> {
  const scope = await getComplexScope();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_reservations_detail")
    .select("*")
    .eq("complex_id", scope.complexId)
    .eq("customer_id", customerId)
    .order("starts_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...r,
    price: Number(r.price),
    deposit_amount: Number(r.deposit_amount),
    paid_amount: Number(r.paid_amount),
  }));
}