"use server";

import { getPaymentsData } from "@/services/payments";
import type { PaymentsData } from "@/services/payments";

export async function reloadPayments(): Promise<PaymentsData> {
  return getPaymentsData();
}