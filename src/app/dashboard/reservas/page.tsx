import type { Metadata } from "next";
import { getCalendarEvents } from "@/services/calendar";
import { ReservationsClient } from "./reservas-client";

export const metadata: Metadata = {
  title: "Reservas",
};

export const dynamic = "force-dynamic";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function ReservasPage() {
  const { events, courts } = await getCalendarEvents(getWeekStart(new Date()));
  return <ReservationsClient initialEvents={events} courts={courts} />;
}