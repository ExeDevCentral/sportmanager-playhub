import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { SectionPlaceholder } from "@/components/dashboard/placeholder";

export const metadata: Metadata = {
  title: "Reservas",
};

export default function Page() {
  return (
    <SectionPlaceholder
      title="Reservas"
      description="Listado completo de reservas con filtros por estado, cancha, cliente y rango de fechas."
      phase={5}
      icon={ClipboardList}
    />
  );
}
