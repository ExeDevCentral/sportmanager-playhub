"use client";

import * as React from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import type { CalendarCourt, CalendarEvent } from "@/lib/calendar-types";
import type { ReservationStatus } from "@/types/database";

const STATUS_VARIANT: Record<ReservationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
  expired: "secondary",
  refunded: "outline",
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
  expired: "Expirada",
  refunded: "Reembolsada",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function customerName(event: CalendarEvent): string {
  return event.customer_name ?? "Sin cliente";
}

export function ReservationsClient({
  initialEvents,
  courts,
}: {
  initialEvents: CalendarEvent[];
  courts: CalendarCourt[];
}) {
  const [events, setEvents] = React.useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ReservationStatus>("all");
  const [courtFilter, setCourtFilter] = React.useState<string>("all");

  const [cancelTarget, setCancelTarget] = React.useState<CalendarEvent | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const matchesQuery =
        !q ||
        (e.customer_name ?? "").toLowerCase().includes(q) ||
        e.court_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesCourt = courtFilter === "all" || e.court_id === courtFilter;
      return matchesQuery && matchesStatus && matchesCourt;
    });
  }, [events, query, statusFilter, courtFilter]);

  const counts = React.useMemo(() => {
    const by = (s: string) => events.filter((e) => e.status === s).length;
    return {
      total: events.length,
      pending: by("pending"),
      confirmed: by("confirmed"),
      completed: by("completed"),
      cancelled: by("cancelled"),
    };
  }, [events]);

  const label = (e: CalendarEvent) => `${customerName(e)} · ${e.court_name} ${formatTime(e.starts_at)}`;

  const handleConfirm = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setLoading(true);
    setTimeout(() => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "confirmed" as const } : e)));
      setLoading(false);
      toast.success("Reserva confirmada", { description: label({ ...ev, status: "confirmed" }) });
    }, 350);
  };

  const handleComplete = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setLoading(true);
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: "completed" as const, paid_amount: Math.max(e.paid_amount, e.price) }
            : e,
        ),
      );
      setLoading(false);
      toast.success("Reserva completada", { description: `${customerName(ev)} · turno cerrado` });
    }, 350);
  };

  const handleCharge = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setLoading(true);
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, paid_amount: e.price } : e)),
      );
      setLoading(false);
      toast.success("Pago registrado", {
        description: `${formatCurrency(ev.price)} · ${customerName(ev)}`,
      });
    }, 350);
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    const ev = cancelTarget;
    setLoading(true);
    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) => (e.id === ev.id ? { ...e, status: "cancelled" as const } : e)),
      );
      setLoading(false);
      setCancelTarget(null);
      setCancelReason("");
      toast.success("Reserva cancelada", {
        description: cancelReason.trim()
          ? `${customerName(ev)} · ${cancelReason.trim()}`
          : customerName(ev),
      });
    }, 350);
  };

  const handleExport = () => {
    downloadCSV(
      `reservas-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Fecha", "Hora", "Cancha", "Cliente", "Estado", "Importe", "Pagado"],
      filtered.map((e) => [
        formatDate(e.starts_at),
        formatTime(e.starts_at),
        e.court_name,
        customerName(e),
        STATUS_LABEL[e.status] ?? e.status,
        e.price,
        e.paid_amount >= e.price ? e.price : e.paid_amount,
      ]),
    );
    toast.success("Exportación lista", {
      description: `${filtered.length} reservas exportadas a CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reservas</h1>
            <p className="text-sm text-muted-foreground">
              Listado completo de turnos de la semana con acciones y pagos.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold tabular-nums">{counts.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-semibold tabular-nums">{counts.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Confirmadas</p><p className="text-2xl font-semibold tabular-nums">{counts.confirmed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Completadas</p><p className="text-2xl font-semibold tabular-nums">{counts.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Canceladas</p><p className="text-2xl font-semibold tabular-nums">{counts.cancelled}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por cliente o cancha…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | ReservationStatus)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={courtFilter} onValueChange={setCourtFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cancha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las canchas</SelectItem>
            {courts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setQuery("");
            setStatusFilter("all");
            setCourtFilter("all");
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No se encontraron reservas.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((e) => {
                const isDone = e.status === "completed" || e.status === "cancelled";
                return (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(e.starts_at)}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">{formatTime(e.starts_at)}</TableCell>
                    <TableCell>{e.court_name}</TableCell>
                    <TableCell className="font-medium">{customerName(e)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>
                        {STATUS_LABEL[e.status] ?? e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(e.price ?? 0)}
                    </TableCell>
                    <TableCell>
                      {(e.paid_amount ?? 0) >= (e.price ?? 0) ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Pagado
                        </span>
                      ) : (e.paid_amount ?? 0) > 0 ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Seña {formatCurrency(e.paid_amount ?? 0)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Adeuda</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {e.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Confirmar reserva"
                            onClick={() => handleConfirm(e.id)}
                            disabled={loading}
                          >
                            <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </Button>
                        )}
                        {(e.status === "pending" || e.status === "confirmed") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Marcar completada"
                              onClick={() => handleComplete(e.id)}
                              disabled={loading}
                            >
                              <CheckCircle2 className="size-4 text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Registrar pago"
                              onClick={() => handleCharge(e.id)}
                              disabled={loading}
                            >
                              <CreditCard className="size-4 text-foreground" />
                            </Button>
                          </>
                        )}
                        {!isDone && e.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Cancelar reserva"
                            onClick={() => setCancelTarget(e)}
                            disabled={loading}
                          >
                            <XCircle className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `${customerName(cancelTarget)} · ${cancelTarget.court_name} ${formatTime(cancelTarget.starts_at)}`
                : ""}
              . La cancha quedará disponible para otro turno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo (opcional)…"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
            >
              Cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}