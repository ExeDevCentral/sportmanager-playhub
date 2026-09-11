import type { Metadata } from "next";
import { getDashboardData } from "@/services/dashboard";
import { getCustomers } from "@/services/customers";
import { AnalyticsClient } from "./analytics-client";
import { requireDemoRole } from "@/lib/auth/role";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireDemoRole("owner");
  const [data, customers] = await Promise.all([getDashboardData(), getCustomers()]);
  return <AnalyticsClient data={data} customers={customers} />;
}