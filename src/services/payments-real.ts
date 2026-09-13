import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus, PaymentConcept, PaymentProvider } from "@/types/database";

export type PaymentSummary = {
  id: string;
  reservation_id: string | null;
  customer_name: string | null;
  court_name: string | null;
  concept: PaymentConcept;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  approved_at: string | null;
  created_at: string;
};

export type PaymentsData = {
  payments: PaymentSummary[];
  totals: {
    approved: number;
    pending: number;
    refunded: number;
    rejected: number;
  };
};

/** Implementación real (Supabase) de getPaymentsData. Server-only. */
export async function getPaymentsDataReal(): Promise<PaymentsData> {
  const scope = await getComplexScope();
  const supabase = await createClient();

  const { data: paymentsRes, error: payErr } = await supabase
    .from("payments")
    .select("id,reservation_id,customer_id,concept,amount,currency,status,provider,provider_payment_id,approved_at,created_at")
    .eq("complex_id", scope.complexId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (payErr) throw new Error(payErr.message);

  const reservationIds = [...new Set((paymentsRes ?? []).map((p) => p.reservation_id).filter(Boolean) as string[])];
  const customerIds = [...new Set((paymentsRes ?? []).map((p) => p.customer_id).filter(Boolean) as string[])];

  const [reservationsMap, customersMap] = await Promise.all([
    reservationIds.length > 0
      ? supabase
          .from("v_reservations_detail")
          .select("id,court_name,customer_name")
          .in("id", reservationIds)
          .then((r) => {
            const map = new Map<string, { court_name: string; customer_name: string | null }>();
            for (const row of r.data ?? []) map.set(row.id, { court_name: row.court_name, customer_name: row.customer_name });
            return map;
          })
      : Promise.resolve(new Map<string, { court_name: string; customer_name: string | null }>()),
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id,first_name,last_name")
          .in("id", customerIds)
          .then((r) => {
            const map = new Map<string, string>();
            for (const row of r.data ?? []) map.set(row.id, `${row.first_name} ${row.last_name ?? ""}`.trim());
            return map;
          })
      : Promise.resolve(new Map<string, string>()),
  ]);

  const payments: PaymentSummary[] = (paymentsRes ?? []).map((p) => {
    const resInfo = p.reservation_id ? reservationsMap.get(p.reservation_id) : undefined;
    const custName = p.customer_id ? customersMap.get(p.customer_id) : resInfo?.customer_name ?? null;
    return {
      id: p.id,
      reservation_id: p.reservation_id,
      customer_name: custName ?? null,
      court_name: resInfo?.court_name ?? null,
      concept: p.concept as PaymentConcept,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status as PaymentStatus,
      provider: p.provider as PaymentProvider,
      provider_payment_id: p.provider_payment_id,
      approved_at: p.approved_at,
      created_at: p.created_at,
    };
  });

  const totals = {
    approved: payments.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    refunded: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
    rejected: payments.filter((p) => p.status === "rejected").reduce((s, p) => s + p.amount, 0),
  };

  return { payments, totals };
}