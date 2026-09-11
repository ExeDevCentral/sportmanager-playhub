import type { Metadata } from "next";
import { getDashboardData } from "@/services/dashboard";
import { getPaymentsData } from "@/services/payments";
import { ReportesClient } from "./reportes-client";

export const metadata: Metadata = {
  title: "Reportes",
};

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const [data, payments] = await Promise.all([getDashboardData(), getPaymentsData()]);
  return <ReportesClient data={data} payments={payments} />;
}