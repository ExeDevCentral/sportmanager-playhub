import { isDemoMode } from "@/lib/demo";
import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import { mulberry32 } from "@/lib/random";
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

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Contracargo",
};

export const PAYMENT_CONCEPT_LABEL: Record<PaymentConcept, string> = {
  deposit: "Seña",
  full: "Pago total",
  balance: "Saldo",
  refund: "Reembolso",
};

export const PAYMENT_PROVIDER_LABEL: Record<PaymentProvider, string> = {
  mercadopago: "Mercado Pago",
  manual: "Manual",
  other: "Otro",
};

const DEMO_CUSTOMERS = [
  "Juan Pérez", "María González", "Carlos Ruiz", "Ana Martínez",
  "Pedro Sánchez", "Lucía Fernández", "Diego Torres", "Sofía Castro",
];

const DEMO_COURTS = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

function getDemoPayments(): PaymentsData {
  const rand = mulberry32(20260908);
  const concepts: PaymentConcept[] = ["deposit", "full", "balance", "deposit", "full"];
  const statuses: PaymentStatus[] = ["approved", "approved", "pending", "approved", "rejected", "refunded"];
  const providers: PaymentProvider[] = ["mercadopago", "manual"];

  const today = new Date();
  const payments: PaymentSummary[] = Array.from({ length: 18 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(i / 2));
    date.setHours(10 + (i % 8), (i * 11) % 60, 0, 0);

    const amount = Math.round((4000 + rand() * 16000) / 100) * 100;
    const status = statuses[Math.floor(rand() * statuses.length)]!;
    const concept = concepts[Math.floor(rand() * concepts.length)]!;
    const provider = providers[Math.floor(rand() * providers.length)]!;
    const approved = status === "approved" ? date.toISOString() : status === "refunded" ? date.toISOString() : null;

    return {
      id: `pay-${1000 + i}`,
      reservation_id: `res-${2000 + i}`,
      customer_name: DEMO_CUSTOMERS[Math.floor(rand() * DEMO_CUSTOMERS.length)]!,
      court_name: DEMO_COURTS[Math.floor(rand() * DEMO_COURTS.length)]!,
      concept,
      amount,
      currency: "ARS",
      status,
      provider,
      provider_payment_id:
        provider === "mercadopago" && status !== "pending"
          ? `${Math.floor(Math.random() * 1e9)}`
          : null,
      approved_at: approved,
      created_at: date.toISOString(),
    };
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const totals = {
    approved: payments.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    refunded: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
    rejected: payments.filter((p) => p.status === "rejected").reduce((s, p) => s + p.amount, 0),
  };

  return { payments, totals };
}

export async function getPaymentsData(): Promise<PaymentsData> {
  if (isDemoMode()) {
    return getDemoPayments();
  }

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
