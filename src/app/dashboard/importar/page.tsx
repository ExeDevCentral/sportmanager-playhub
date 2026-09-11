import type { Metadata } from "next";
import { Suspense } from "react";
import { ExcelClient } from "./excel-client";

export const metadata: Metadata = {
  title: "Importar Excel",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <ExcelClient />
    </Suspense>
  );
}