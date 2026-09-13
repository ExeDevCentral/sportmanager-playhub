import type { Metadata } from "next";
import { Suspense } from "react";
import { PromotionsClient } from "./promotions-client";
import { requireDemoRole } from "@/lib/auth/role";
import { getSettingsData } from "@/services/settings";

export const metadata: Metadata = {
  title: "Promociones",
};

export default async function Page() {
  await requireDemoRole("owner");
  const data = await getSettingsData();
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <PromotionsClient data={data} />
    </Suspense>
  );
}