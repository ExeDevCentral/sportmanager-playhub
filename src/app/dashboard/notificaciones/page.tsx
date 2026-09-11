import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <NotificationsClient />
    </Suspense>
  );
}
