import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/placeholder";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function Page() {
  return (
    <SectionPlaceholder
      title="Analytics"
      description="KPIs avanzados: peak hours, repeat rate, revenue per court y comparativas entre períodos."
      phase={10}
      icon={TrendingUp}
    />
  );
}
