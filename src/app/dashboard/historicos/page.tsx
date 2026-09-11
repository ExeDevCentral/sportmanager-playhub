import type { Metadata } from "next";
import { History } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/placeholder";

export const metadata: Metadata = {
  title: "Históricos",
};

export default function Page() {
  return (
    <SectionPlaceholder
      title="Históricos"
      description="Consulta de datos históricos importados por año, cliente y cancha."
      phase={9}
      icon={History}
    />
  );
}
