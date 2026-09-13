"use server";

import { getCustomers, getCustomerHistory } from "@/services/customers";
import type { CustomerStats } from "@/types/database";
import type { ReservationDetail } from "@/types/database";

export async function loadCustomers(): Promise<CustomerStats[]> {
  return getCustomers();
}

export async function loadCustomerHistory(customerId: string): Promise<ReservationDetail[]> {
  return getCustomerHistory(customerId);
}