import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsClient } from "./notifications-client";
import { getEmailSetup } from "@/services/mailer";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function Page() {
  const emailSetup = getEmailSetup();
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <NotificationsClient emailSetup={emailSetup} />
    </Suspense>
  );
}