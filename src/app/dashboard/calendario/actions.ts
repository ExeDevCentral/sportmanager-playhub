"use server";

import { getCalendarEvents, getCustomers, createReservation, cancelReservation } from "@/services/calendar";
import type { CalendarEvent, CalendarCourt, CalendarCustomer } from "@/lib/calendar-types";
import type { ReservationFormValues } from "@/lib/validations/reservation";

export async function loadCalendarWeek(
  weekStart: Date,
): Promise<{ events: CalendarEvent[]; courts: CalendarCourt[] }> {
  return getCalendarEvents(weekStart);
}

export async function loadCustomers(): Promise<CalendarCustomer[]> {
  return getCustomers();
}

export async function createReservationAction(data: ReservationFormValues): Promise<CalendarEvent> {
  return createReservation(data);
}

export async function cancelReservationAction(reservationId: string, reason?: string): Promise<void> {
  return cancelReservation(reservationId, reason);
}