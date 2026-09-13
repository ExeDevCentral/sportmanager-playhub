import type { PaymentStatus, PaymentConcept, PaymentProvider, ReservationStatus } from "@/types/database";

export const HISTORY_STATUS_LABEL: Partial<Record<ReservationStatus, string>> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
  expired: "Expirada",
  refunded: "Reembolsada",
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

export const DEMO_MODE_PREFIX = "Modo demo:";

export function isDemoError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(DEMO_MODE_PREFIX);
}