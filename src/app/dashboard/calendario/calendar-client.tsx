"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeekGrid } from "@/components/calendar/week-grid";
import { ReservationDialog } from "@/components/calendar/reservation-dialog";
import {
  getCalendarEvents,
  getCustomers,
  createReservation,
  cancelReservation,
  isDemoModeError,
} from "@/services/calendar";
import { toast } from "sonner";
import type { CalendarEvent, CalendarCourt, CalendarCustomer, CalendarDay } from "@/lib/calendar-types";
import type { ReservationFormValues } from "@/lib/validations/reservation";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekDays(start: Date): CalendarDay[] {
  const days: CalendarDay[] = [];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: `${dayNames[i]} ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`,
      dayShort: dayNames[i]!,
      dayNum: d.getDate().toString().padStart(2, "0"),
      monthShort: monthNames[d.getMonth()]!,
    });
  }
  return days;
}

function formatWeekTitle(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} de ${months[start.getMonth()]}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
}

export function CalendarClient() {
  const searchParams = useSearchParams();

  const today = new Date();
  const initialWeek = searchParams.get("week");
  const [weekStart, setWeekStart] = React.useState<Date>(
    initialWeek ? new Date(initialWeek + "T00:00:00") : getWeekStart(today),
  );
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [courts, setCourts] = React.useState<CalendarCourt[]>([]);
  const [customers, setCustomers] = React.useState<CalendarCustomer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | undefined>();
  const [initialFormData, setInitialFormData] = React.useState<Partial<ReservationFormValues>>({});

  // Fetch data
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getCalendarEvents(weekStart), getCustomers()])
      .then(([evData, custData]) => {
        if (cancelled) return;
        setEvents(evData.events);
        setCourts(evData.courts);
        setCustomers(custData);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Error al cargar el calendario.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [weekStart]);

  const days = React.useMemo(() => formatWeekDays(weekStart), [weekStart]);

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(today));
  };

  const handleSlotClick = (courtId: string, date: string, hour: number) => {
    const start = new Date(date + `T${hour.toString().padStart(2, "0")}:00:00`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 60);
    setDialogMode("create");
    setSelectedEvent(undefined);
    setInitialFormData({
      court_id: courtId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    });
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setDialogMode("edit");
    setSelectedEvent(event);
    setInitialFormData({});
    setDialogOpen(true);
  };

  const handleCreateSubmit = async (data: ReservationFormValues) => {
    try {
      const newEvent = await createReservation(data);
      setEvents((prev) => [...prev, newEvent]);
      setDialogOpen(false);
    } catch (error) {
      if (!isDemoModeError(error)) {
        console.error("Error al crear la reserva:", error);
        toast.error("No se pudo crear la reserva", {
          description: error instanceof Error ? error.message : "Intentá de nuevo más tarde.",
        });
        return;
      }
      // In demo mode, create locally
      const court = courts.find((c) => c.id === data.court_id);
      const customer = data.customer_id ? customers.find((c) => c.id === data.customer_id) : null;
      const newEvent: CalendarEvent = {
        id: `local-${Date.now()}`,
        court_id: data.court_id,
        customer_id: data.customer_id,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        status: "pending",
        kind: data.kind,
        price: 14000,
        currency: "ARS",
        paid_amount: 0,
        title: data.title,
        notes: data.notes,
        expires_at: null,
        court_name: court?.name ?? "Cancha",
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : null,
      };
      setEvents((prev) => [...prev, newEvent]);
      setDialogOpen(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await cancelReservation(reservationId);
    } catch {
      // Demo mode: update locally
      setEvents((prev) =>
        prev.map((e) =>
          e.id === reservationId ? { ...e, status: "cancelled" as const } : e,
        ),
      );
    }
    setDialogOpen(false);
  };

  const todayStr = today.toISOString().slice(0, 10);
  const todayCount = events.filter((e) => e.starts_at.slice(0, 10) === todayStr).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Calendario</h1>
            <p className="text-sm text-muted-foreground">
              {formatWeekTitle(weekStart)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{todayCount} hoy</Badge>
          <Button variant="outline" size="icon" onClick={goToPrevWeek} aria-label="Semana anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Siguiente semana">
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" onClick={() => {
            setDialogMode("create");
            setSelectedEvent(undefined);
            setInitialFormData({
              starts_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(),
              ends_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0).toISOString(),
            });
            setDialogOpen(true);
          }}>
            <Plus className="mr-1 size-4" />
            Nueva reserva
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Cargando calendario…
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="text-sm font-medium text-destructive">No se pudo cargar el calendario</p>
          <p className="max-w-md text-center text-xs text-muted-foreground">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              // Trigger the effect by re-setting weekStart to a new Date instance
              setWeekStart((prev) => new Date(prev.getTime()));
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Grid */}
      {!loading && !loadError && (
        <WeekGrid
          days={days}
          courts={courts}
          events={events}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
        />
      )}

      {/* Dialog */}
      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        courts={courts}
        customers={customers}
        initialData={initialFormData}
        selectedEvent={selectedEvent}
        onSubmit={dialogMode === "create" ? handleCreateSubmit : (data) => {
          // Demo mode: update locally
          if (selectedEvent) {
            const court = courts.find((c) => c.id === data.court_id);
            const customer = data.customer_id ? customers.find((c) => c.id === data.customer_id) : null;
            setEvents((prev) =>
              prev.map((e) =>
                e.id === selectedEvent.id
                  ? {
                      ...e,
                      court_id: data.court_id,
                      customer_id: data.customer_id,
                      starts_at: data.starts_at,
                      ends_at: data.ends_at,
                      kind: data.kind,
                      title: data.title,
                      notes: data.notes,
                      court_name: court?.name ?? e.court_name,
                      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : e.customer_name,
                    }
                  : e,
              ),
            );
          }
          setDialogOpen(false);
        }}
        onCancel={handleCancelReservation}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-blue-400 bg-blue-50" />
          Confirmada
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50" />
          Pendiente
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-emerald-400 bg-emerald-50" />
          Completada
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-zinc-400 bg-zinc-200 line-through" />
          Bloqueo / Mant.
        </span>
      </div>
    </div>
  );
}
