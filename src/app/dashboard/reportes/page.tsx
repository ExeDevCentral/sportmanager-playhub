import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/placeholder";

export const metadata: Metadata = {
  title: "Reportes",
};

export default function Page() {
  return (
    <SectionPlaceholder
      title="Reportes"
      description="Ingresos, ocupación y reservas por período, descargables en Excel."
      phase={10}
      icon={BarChart3}
    />
  );
}
