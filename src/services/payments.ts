import { isDemoMode } from "@/lib/demo";
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

export {
  PAYMENT_STATUS_LABEL,
  PAYMENT_CONCEPT_LABEL,
  PAYMENT_PROVIDER_LABEL,
} from "@/services/labels";

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
  // La implementación real vive en payments-real.ts (server-only) para no
  // arrastrar cookies()/RLS al bundle de los client components.
  return (await import("@/services/payments-real")).getPaymentsDataReal();
}
