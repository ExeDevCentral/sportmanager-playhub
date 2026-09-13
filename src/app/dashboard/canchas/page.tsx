import type { Metadata } from "next";
import { Suspense } from "react";
import { CourtsClient } from "./courts-client";
import { getSettingsData } from "@/services/settings";

export const metadata: Metadata = {
  title: "Canchas",
};

export default async function Page() {
  const data = await getSettingsData();
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <CourtsClient data={data} />
    </Suspense>
  );
}