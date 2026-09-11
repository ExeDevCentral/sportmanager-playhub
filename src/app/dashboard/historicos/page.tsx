import type { Metadata } from "next";
import { getReservationHistory } from "@/services/history";
import { HistoricosClient } from "./historicos-client";
import { requireDemoRole } from "@/lib/auth/role";

export const metadata: Metadata = {
  title: "Históricos",
};

export const dynamic = "force-dynamic";

export default async function HistoricosPage() {
  await requireDemoRole("owner");
  const history = await getReservationHistory();
  return <HistoricosClient initialHistory={history} />;
}