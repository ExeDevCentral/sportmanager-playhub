"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarCourt } from "@/lib/calendar-types";
import { formatCurrency } from "@/lib/format";

const HOUR_START = 9;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const HOUR_HEIGHT = 64; // px per hour row

type WeekGridProps = {
  days: { date: string; label: string }[];
  courts: CalendarCourt[];
  events: CalendarEvent[];
  onSlotClick?: (courtId: string, date: string, hour: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
};
function getEventStyle(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const startMinutes = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;

  const top = Math.max(0, (startMinutes / 60) * HOUR_HEIGHT);
  const height = Math.max(24, (durationMinutes / 60) * HOUR_HEIGHT - 2);

  return { top, height };
}

function statusStyles(status: string, kind: string) {
  if (kind === "block" || kind === "maintenance") {
    return "bg-zinc-200 border-zinc-400 text-zinc-600 dark:bg-zinc-700 dark:border-zinc-500 dark:text-zinc-300";
  }
  switch (status) {
    case "confirmed":
      return "bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-200";
    case "pending":
      return "bg-amber-50 border-amber-400 border-dashed text-amber-900 dark:bg-amber-950 dark:border-amber-500 dark:text-amber-200";
    case "completed":
      return "bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-200";
    case "cancelled":
    case "expired":
      return "bg-zinc-100 border-zinc-300 text-zinc-400 line-through dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-500";
    default:
      return "bg-slate-50 border-slate-400 text-slate-900 dark:bg-slate-900 dark:border-slate-500 dark:text-slate-200";
  }
}

function EventBlock({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}) {
  const { top, height } = getEventStyle(event.starts_at, event.ends_at);
  const styles = statusStyles(event.status, event.kind);
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  const timeLabel = `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}–${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;

  return (
        <button
          type="button"
          onClick={() => onClick?.(event)}
          className={cn(
            "absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
            styles,
          )}
          style={{ top, height, minHeight: height }}
          title={`${event.customer_name ?? "Sin cliente"} — ${timeLabel}`}
        >
      <span className="block truncate font-medium">{timeLabel}</span>
      {height >= 36 && (
        <span className="block truncate">{event.customer_name ?? "Sin cliente"}</span>
      )}
      {height >= 52 && (
        <span className="block truncate text-[10px] opacity-70">{formatCurrency(event.price)}</span>
      )}
    </button>
  );
}

function CourtRow({
  court,
  days,
  events,
  onSlotClick,
  onEventClick,
}: {
  court: CalendarCourt;
  days: { date: string }[];
  events: CalendarEvent[];
  onSlotClick?: WeekGridProps["onSlotClick"];
  onEventClick?: WeekGridProps["onEventClick"];
}) {
  const courtEvents = events.filter((e) => e.court_id === court.id);
  const rowHeight = HOUR_HEIGHT * (HOUR_END - HOUR_START);

  return (
    <div className="contents">
      {/* Court label (sticky left) */}
      <div
        className="sticky left-0 z-20 flex items-center overflow-hidden border-b border-r bg-background/95 px-3 py-2 text-sm font-medium backdrop-blur supports-[backdrop-filter]:bg-background/85"
        style={{ height: rowHeight }}
      >
        <div className="flex w-full min-w-0 flex-col gap-1">
          <span className="line-clamp-2 leading-tight font-semibold text-foreground" title={court.name}>
            {court.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              court.status === "active"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                court.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            {court.status === "active"
              ? "Activa"
              : court.status === "maintenance"
                ? "Mantenimiento"
                : "Inactiva"}
          </span>
        </div>
      </div>

      {/* Time gutter (sticky) */}
      <div
        className="sticky left-[148px] z-20 border-b border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
        style={{ height: rowHeight }}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute inset-x-0 flex items-start justify-end pr-2 pt-0.5 text-[11px] text-muted-foreground tabular-nums"
            style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
          >
            {h.toString().padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day) => {
        const dayEvents = courtEvents.filter((e) => e.starts_at.slice(0, 10) === day.date);
        return (
          <div
            key={day.date}
            className="relative border-b border-r"
            style={{ height: rowHeight }}
          >
            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border/50"
                style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour lines */}
            {HOURS.map((h) => (
              <div
                key={`half-${h}`}
                className="absolute inset-x-0 border-t border-dashed border-border/30"
                style={{ top: (h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Click zones (per hour) */}
            {HOURS.map((h) => (
              <button
                key={`slot-${h}`}
                type="button"
                className="absolute inset-x-0 z-10 cursor-pointer opacity-0 hover:opacity-100 hover:bg-primary/5 transition-opacity"
                style={{ top: (h - HOUR_START) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                onClick={() => onSlotClick?.(court.id, day.date, h)}
                aria-label={`Crear reserva ${court.name} ${day.date} ${h}:00`}
              />
            ))}

            {/* Event blocks */}
            {dayEvents.map((evt) => (
              <EventBlock key={evt.id} event={evt} onClick={onEventClick} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function WeekGrid({ days, courts, events, onSlotClick, onEventClick }: WeekGridProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <div
        className="grid min-w-[780px]"
        style={{ gridTemplateColumns: `148px 54px repeat(${days.length}, minmax(110px, 1fr))` }}
      >
        {/* Header row: court label + hour label + day columns */}
        <div className="sticky left-0 top-0 z-30 flex h-11 items-center border-b border-r bg-background/95 px-3 text-xs font-medium text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
          Cancha
        </div>
        <div className="sticky left-[148px] top-0 z-30 flex h-11 items-center justify-end border-b border-r bg-background/95 pr-2 text-xs font-medium text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
          Hora
        </div>
        {days.map((day) => (
          <div
            key={day.date}
            className="sticky top-0 z-20 flex h-11 items-center justify-center border-b border-r bg-background/95 px-2 text-sm font-medium backdrop-blur supports-[backdrop-filter]:bg-background/85"
          >
            {day.label}
          </div>
        ))}

        {/* Court rows */}
        {courts.map((court) => (
          <CourtRow
            key={court.id}
            court={court}
            days={days}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}
