import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveRole } from "@/lib/auth/role";
import { getDemoAccountByRole } from "@/lib/auth/demo-account";
import { PaymentsClient } from "./payments-client";

export const metadata: Metadata = {
  title: "Pagos",
};

export default async function Page() {
  const role = await getActiveRole();
  const account = getDemoAccountByRole(role);
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <PaymentsClient role={role} actorName={account.name} />
    </Suspense>
  );
}
