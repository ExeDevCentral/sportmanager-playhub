"use client";

import * as React from "react";
import { Volleyball, Loader2, Plus, Sun, Moon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSettingsData, type CourtView } from "@/services/settings";
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

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activa", variant: "default" },
  maintenance: { label: "Mantenimiento", variant: "outline" },
  inactive: { label: "Inactiva", variant: "secondary" },
};

const SURFACE_STYLE: Record<string, string> = {
  Techada: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Cemento: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Vidrio: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};

export function CourtsClient() {
  const [courts, setCourts] = React.useState<CourtView[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingStatus, setPendingStatus] = React.useState<{ id: string; status: CourtView["status"] } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getSettingsData()
      .then((d) => {
        if (!cancelled) {
          const saved = window.localStorage.getItem("sportmanager-demo-courts");
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as CourtView[];
              if (Array.isArray(parsed)) {
                setCourts(parsed);
                return;
              }
            } catch {
              window.localStorage.removeItem("sportmanager-demo-courts");
            }
          }
          setCourts(d.courts);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    toast.success("Estado actualizado oficialmente", {
      description: `${changedCourt?.name ?? "Cancha"} ahora figura como ${STATUS_BADGE[pendingStatus.status]?.label.toLowerCase()}. El cambio queda visible en este dashboard y la sesión demo.`,
    });
    setPendingStatus(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Cargando canchas…
      </div>
    );
  }

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
            setCourts((prev) => [
              ...prev,
              {
                id: `local-court-${Date.now()}`,
                name: `Cancha ${prev.length + 1}`,
                description: "Cancha creada en modo demo.",
                surface: "Techada",
                is_indoor: true,
                has_lighting: true,
                status: "active",
                is_public: false,
                position: prev.length + 1,
              },
            ]);
            toast.success("Cancha agregada", { description: "La nueva cancha queda disponible en esta sesión demo." });
          }}
        >
          <Plus className="mr-1 size-4" /> Agregar cancha
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((c) => {
          const badge = STATUS_BADGE[c.status]!;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <CardDescription className="truncate">{c.description ?? "Sin descripción"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className={SURFACE_STYLE[c.surface ?? ""]}>
                    {c.surface ?? "Superficie"}
                  </Badge>
                  {c.is_indoor && <Badge variant="secondary"><Sun className="mr-1 size-3" /> Techada</Badge>}
                  {c.has_lighting && <Badge variant="secondary"><Moon className="mr-1 size-3" /> Iluminada</Badge>}
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {c.is_public ? "Visible en el sitio público" : "Oculta del sitio público"}
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