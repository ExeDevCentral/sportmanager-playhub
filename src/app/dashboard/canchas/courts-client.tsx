"use client";

import * as React from "react";
import { Volleyball, Plus, Sun, Moon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CourtView } from "@/services/settings";
import type { SettingsData } from "@/services/settings";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_META: Record<string, { label: string; dotClass: string; textClass: string }> = {
  active: {
    label: "Activa",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 [[data-dashboard-theme='artistic']_&]:text-emerald-400",
  },
  maintenance: {
    label: "Mantenimiento",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 [[data-dashboard-theme='artistic']_&]:text-amber-300",
  },
  inactive: {
    label: "Inactiva",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
  },
};

export function CourtsClient({ data }: { data: SettingsData }) {
  const [courts, setCourts] = React.useState<CourtView[]>(() => {
    if (typeof window === "undefined") return data.courts;
    const saved = window.localStorage.getItem("sportmanager-demo-courts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CourtView[];
        if (Array.isArray(parsed)) return parsed;
      } catch {
        window.localStorage.removeItem("sportmanager-demo-courts");
      }
    }
    return data.courts;
  });
  const [pendingStatus, setPendingStatus] = React.useState<{ id: string; status: CourtView["status"] } | null>(null);

  const requestStatusChange = (court: CourtView) => {
    const next: CourtView["status"] =
      court.status === "active" ? "maintenance" : court.status === "maintenance" ? "inactive" : "active";
    setPendingStatus({ id: court.id, status: next });
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    setCourts((prev) => {
      const nextCourts = prev.map((court) =>
        court.id === pendingStatus.id ? { ...court, status: pendingStatus.status } : court,
      );
      window.localStorage.setItem("sportmanager-demo-courts", JSON.stringify(nextCourts));
      return nextCourts;
    });
    const changedCourt = courts.find((court) => court.id === pendingStatus.id);
    toast.success("Estado actualizado", {
      description: `${changedCourt?.name ?? "Cancha"} ahora figura como ${STATUS_META[pendingStatus.status]?.label.toLowerCase()}.`,
    });
    setPendingStatus(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volleyball className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Canchas</h1>
            <p className="text-sm text-muted-foreground">Superficie, estado y visibilidad pública.</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCourts((prev) => {
              const next = [
                ...prev,
                {
                  id: `local-court-${Date.now()}`,
                  name: `Cancha ${prev.length + 1}`,
                  description: "Cancha creada en modo demo.",
                  surface: "Techada",
                  is_indoor: true,
                  has_lighting: true,
                  status: "active" as const,
                  is_public: false,
                  position: prev.length + 1,
                },
              ];
              window.localStorage.setItem("sportmanager-demo-courts", JSON.stringify(next));
              return next;
            });
            toast.success("Cancha agregada", { description: "La nueva cancha queda disponible en esta sesión demo." });
          }}
        >
          <Plus className="mr-1 size-4" /> Agregar cancha
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((c) => {
          const statusMeta = STATUS_META[c.status] ?? STATUS_META.inactive!;
          const specs = [
            c.surface || "Estándar",
            c.is_indoor ? "Techada" : "Descubierta",
            c.has_lighting ? "Iluminación LED" : null,
          ].filter(Boolean);

          return (
            <Card key={c.id} className="justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}>
                    <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>
                </div>
                <CardDescription className="truncate">{c.description ?? "Sin descripción"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {c.is_indoor ? (
                    <Sun className="size-3.5 text-sky-500" />
                  ) : (
                    <Sun className="size-3.5 text-amber-500" />
                  )}
                  {c.has_lighting && <Moon className="size-3.5 text-indigo-400" />}
                  <span>{specs.join(" · ")}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {c.is_public ? "Publicada en reservas" : "Solo uso interno"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => requestStatusChange(c)}>
                    Cambiar estado
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <AlertDialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><AlertTriangle className="size-5 text-[color:var(--dashboard-attention)]" /></AlertDialogMedia>
            <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
            <AlertDialogDescription>
              El estado se reflejará inmediatamente en el dashboard demo y quedará guardado para esta sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar cambio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}