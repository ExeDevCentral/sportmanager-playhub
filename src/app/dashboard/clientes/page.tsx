import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersClient } from "./customers-client";

export const metadata: Metadata = {
  title: "Clientes",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <CustomersClient />
    </Suspense>
  );
}