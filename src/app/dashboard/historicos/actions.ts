"use server";

import { getReservationHistory } from "@/services/history";
import type { HistoryRecord } from "@/services/history";

export async function reloadHistory(): Promise<HistoryRecord[]> {
  return getReservationHistory();
}