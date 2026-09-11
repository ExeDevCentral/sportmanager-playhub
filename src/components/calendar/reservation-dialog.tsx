"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { reservationFormSchema, type ReservationFormValues } from "@/lib/validations/reservation";
import type { CalendarEvent, CalendarCourt, CalendarCustomer } from "@/lib/calendar-types";
import { formatCurrency } from "@/lib/format";

type ReservationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courts: CalendarCourt[];
  customers: CalendarCustomer[];
  initialData?: Partial<ReservationFormValues> & { id?: string };
  selectedEvent?: CalendarEvent;
  onSubmit: (data: ReservationFormValues) => void;
  onCancel?: (reservationId: string) => void;
};

function ReservationForm({
  mode,
  courts,
  customers,
  initialData,
  selectedEvent,
  onSubmit,
  onCancel,
  onOpenChange,
}: {
  mode: ReservationDialogProps["mode"];
  courts: CalendarCourt[];
  customers: CalendarCustomer[];
  initialData?: Partial<ReservationFormValues>;
  selectedEvent?: CalendarEvent;
  onSubmit: (data: ReservationFormValues) => void;
  onCancel?: (reservationId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = React.useState<ReservationFormValues>({
    court_id: initialData?.court_id ?? selectedEvent?.court_id ?? "",
    customer_id: initialData?.customer_id ?? selectedEvent?.customer_id ?? null,
    starts_at: initialData?.starts_at ?? selectedEvent?.starts_at ?? "",
    ends_at: initialData?.ends_at ?? selectedEvent?.ends_at ?? "",
    kind: initialData?.kind ?? selectedEvent?.kind ?? "booking",
    title: initialData?.title ?? selectedEvent?.title ?? null,
    notes: initialData?.notes ?? selectedEvent?.notes ?? null,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = reservationFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (path) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Nueva reserva" : "Editar reserva"}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Completá los datos para crear la reserva."
            : selectedEvent
              ? `Reserva de ${selectedEvent.customer_name ?? "cliente"} — ${selectedEvent.status}`
              : "Modificá los datos de la reserva."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-4 py-2">
        {/* Cancha */}
        <div className="grid gap-2">
          <Label htmlFor="court_id">Cancha</Label>
          <Select
            value={form.court_id}
            onValueChange={(v) => setForm((f) => ({ ...f, court_id: v }))}
          >
            <SelectTrigger id="court_id">
              <SelectValue placeholder="Seleccionar cancha" />
            </SelectTrigger>
            <SelectContent>
              {courts
                .filter((c) => c.status === "active")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.court_id && <p className="text-xs text-destructive">{errors.court_id}</p>}
        </div>

        {/* Cliente */}
        <div className="grid gap-2">
          <Label htmlFor="customer_id">Cliente</Label>
          <Select
            value={form.customer_id ?? "__none__"}
            onValueChange={(v) => setForm((f) => ({ ...f, customer_id: v === "__none__" ? null : v }))}
          >
            <SelectTrigger id="customer_id">
              <SelectValue placeholder="Sin cliente asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin cliente asignado</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="starts_at">Inicio</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={form.starts_at ? form.starts_at.slice(0, 16) : ""}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
            />
            {errors.starts_at && <p className="text-xs text-destructive">{errors.starts_at}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ends_at">Fin</Label>
            <Input
              id="ends_at"
              type="datetime-local"
              value={form.ends_at ? form.ends_at.slice(0, 16) : ""}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
            />
            {errors.ends_at && <p className="text-xs text-destructive">{errors.ends_at}</p>}
          </div>
        </div>

        {/* Tipo */}
        <div className="grid gap-2">
          <Label htmlFor="kind">Tipo</Label>
          <Select
            value={form.kind}
            onValueChange={(v) => setForm((f) => ({ ...f, kind: v as ReservationFormValues["kind"] }))}
          >
            <SelectTrigger id="kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="booking">Reserva</SelectItem>
              <SelectItem value="block">Bloqueo</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="event">Evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Título */}
        <div className="grid gap-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value || null }))}
            placeholder="Ej: Torneo, Evento especial…"
          />
        </div>

        {/* Notas */}
        <div className="grid gap-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            placeholder="Observaciones internas…"
            rows={2}
          />
        </div>

        {/* Resumen (modo edición) */}
        {mode === "edit" && selectedEvent && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={selectedEvent.status === "confirmed" ? "default" : selectedEvent.status === "pending" ? "secondary" : "outline"}>
                {selectedEvent.status}
              </Badge>
              <span className="text-muted-foreground">{selectedEvent.kind}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Precio: {formatCurrency(selectedEvent.price)} · Pagado: {formatCurrency(selectedEvent.paid_amount)}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {mode === "edit" && onCancel && selectedEvent && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowCancelConfirm(true)}
              className="mr-auto"
            >
              Cancelar reserva
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="submit">{mode === "create" ? "Crear reserva" : "Guardar cambios"}</Button>
        </DialogFooter>
      </form>

      {/* Cancel confirmation */}
      {showCancelConfirm && selectedEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">¿Cancelar esta reserva?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta acción no se puede deshacer. La reserva de{" "}
              <strong>{selectedEvent.customer_name}</strong> será cancelada permanentemente.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                No, volver
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onCancel?.(selectedEvent.id);
                  onOpenChange(false);
                }}
              >
                Sí, cancelar reserva
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ReservationDialog({
  open,
  onOpenChange,
  mode,
  courts,
  customers,
  initialData,
  selectedEvent,
  onSubmit,
  onCancel,
}: ReservationDialogProps) {
  const dialogKey = `${mode}-${selectedEvent?.id ?? initialData?.court_id ?? "new"}-${initialData?.starts_at ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <ReservationForm
          key={dialogKey}
          mode={mode}
          courts={courts}
          customers={customers}
          initialData={initialData}
          selectedEvent={selectedEvent}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
