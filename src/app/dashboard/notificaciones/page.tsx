import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsClient } from "./notifications-client";
import { getEmailSetup } from "@/services/mailer";
import { getNotificationData } from "@/services/notifications";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default async function Page() {
  const emailSetup = getEmailSetup();
  const data = await getNotificationData();
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <NotificationsClient emailSetup={emailSetup} data={data} />
    </Suspense>
  );
}