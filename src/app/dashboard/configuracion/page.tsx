import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Configuración",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <SettingsClient />
    </Suspense>
  );
}