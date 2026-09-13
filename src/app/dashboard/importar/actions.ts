"use server";

import { getImportHistory, getExistingCustomers } from "@/services/excel";
import type { ImportJobSummary } from "@/services/excel";

export async function loadImportHistory(): Promise<ImportJobSummary[]> {
  return getImportHistory();
}

export async function loadExistingCustomers(): Promise<{ email: string; phone: string }[]> {
  return getExistingCustomers();
}