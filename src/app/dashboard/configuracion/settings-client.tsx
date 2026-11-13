"use client";

import * as React from "react";
import { Settings as SettingsIcon, Save, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { CourtView } from "@/services/settings";
import type { SettingsData } from "@/services/settings";
import type { ComplexSettings } from "@/types/database";

export function SettingsClient({ data }: { data: SettingsData }) {
  const [settings, setSettings] = React.useState<ComplexSettings>(() => {
    if (typeof window === "undefined") return data.settings;
    const saved = window.localStorage.getItem("sportmanager-demo-complex-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.settings) return parsed.settings;
      } catch {
        window.localStorage.removeItem("sportmanager-demo-complex-settings");
      }
    }
    return data.settings;
  });

  const [complexName, setComplexName] = React.useState<string>(() => {
    if (typeof window === "undefined") return data.complexName;
    const saved = window.localStorage.getItem("sportmanager-demo-complex-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.complexName) return parsed.complexName;
      } catch {}
    }
    return data.complexName;
  });

  const [courts] = React.useState<CourtView[]>(data.courts);

  type StaffMember = {
    id: string;
    name: string;
    email: string;
    role: "owner" | "operator";
    active: boolean;
  };

  const [staff, setStaff] = React.useState<StaffMember[]>(() => {
    const defaults: StaffMember[] = [
      { id: "st-1", name: "Juan", email: "demo@sportmanager.app", role: "owner", active: true },
      { id: "st-2", name: "Pedro", email: "operador@sportmanager.app", role: "operator", active: true },
    ];
    if (typeof window === "undefined") return defaults;
    try {
      const saved = window.localStorage.getItem("sportmanager-demo-staff");
      return saved ? (JSON.parse(saved) as StaffMember[]) : defaults;
    } catch {
      return defaults;
    }
  });
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");

  const inviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const next: StaffMember[] = [
      ...staff,
      {
        id: `st-${Date.now()}`,
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: "operator",
        active: true,
      },
    ];
    setStaff(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sportmanager-demo-staff", JSON.stringify(next));
    }
    toast.success("Empleado invitado", {
      description: `${inviteName.trim()} (${inviteEmail.trim()}) habilitado como Operador.`,
    });
    setInviteName("");
    setInviteEmail("");
  };

  const toggleStaffStatus = (id: string) => {
    const next = staff.map((m) => (m.id === id ? { ...m, active: !m.active } : m));
    setStaff(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sportmanager-demo-staff", JSON.stringify(next));
    }
    toast.success("Estado de acceso actualizado");
  };

  const patch = (key: keyof ComplexSettings, value: unknown) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const save = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "sportmanager-demo-complex-settings",
        JSON.stringify({ complexName, settings })
      );
    }
    toast.success("Configuración guardada", {
      description: "Los parámetros del complejo, reservas, señas y visibilidad quedaron aplicados y persistidos.",
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground">Datos del complejo, reservas, pagos y visibilidad.</p>
        </div>
      </div>

      {/* Datos del complejo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complejo</CardTitle>
          <CardDescription>Identidad pública y de facturación.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={complexName} onChange={(e) => setComplexName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Canchas</Label>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {courts.map((c) => (
                <span key={c.id} className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reservas</CardTitle>
          <CardDescription>Duración de turnos, hold y políticas de avance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Duración de slot (min)" value={settings.slot_duration_minutes}
            onChange={(v) => patch("slot_duration_minutes", v)} />
          <NumberField label="Avance máximo (días)" value={settings.max_advance_days}
            onChange={(v) => patch("max_advance_days", v)} />
          <NumberField label="Anticipación mínima (min)" value={settings.min_advance_minutes}
            onChange={(v) => patch("min_advance_minutes", v)} />
          <NumberField label="Hold de reserva (min)" value={settings.hold_minutes}
            onChange={(v) => patch("hold_minutes", v)} />
          <NumberField label="Plazo de cancelación (hs)" value={settings.cancellation_deadline_hours}
            onChange={(v) => patch("cancellation_deadline_hours", v)} />
          <div className="grid gap-2">
            <Label>Cliente puede cancelar</Label>
            <Switch checked={settings.allow_customer_cancellation}
              onCheckedChange={(v) => patch("allow_customer_cancellation", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos</CardTitle>
          <CardDescription>Modalidad de seña y exigencia de pago online.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="deposit">Modalidad de seña</Label>
            <select
              id="deposit"
              value={settings.deposit_mode}
              onChange={(e) => patch("deposit_mode", e.target.value)}
              className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">Sin seña</option>
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </div>
          {settings.deposit_mode === "percent" && (
            <NumberField label={`Seña: ${settings.deposit_percent ?? 0}%`} value={settings.deposit_percent ?? 0}
              onChange={(v) => patch("deposit_percent", v)} />
          )}
          {settings.deposit_mode === "fixed" && (
            <NumberField label="Seña fija ($)" value={settings.deposit_fixed ?? 0}
              onChange={(v) => patch("deposit_fixed", v)} />
          )}
          <Toggle label="Exigir pago online" checked={settings.require_online_payment}
            onChange={(v) => patch("require_online_payment", v)} />
          <Toggle label="Permitir reserva sin cuenta" checked={settings.allow_guest_booking}
            onChange={(v) => patch("allow_guest_booking", v)} />
        </CardContent>
      </Card>

      {/* Recordatorios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recordatorios</CardTitle>
          <CardDescription>Notificaciones automáticas por email y WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Toggle label="Recordatorio 24 h" checked={settings.reminder_24h_enabled}
            onChange={(v) => patch("reminder_24h_enabled", v)} />
          <Toggle label="Recordatorio 2 h (WhatsApp)" checked={settings.reminder_2h_enabled}
            onChange={(v) => patch("reminder_2h_enabled", v)} />
        </CardContent>
      </Card>

      {/* Visibilidad pública */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibilidad pública</CardTitle>
          <CardDescription>Qué métricas se muestran en el sitio del complejo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Toggle label="Publicar estadísticas" checked={settings.publish_stats}
            onChange={(v) => patch("publish_stats", v)} />
          <Toggle label="Publicar ocupación" checked={settings.publish_occupancy}
            onChange={(v) => patch("publish_occupancy", v)} />
          <Toggle label="Publicar cantidad de reservas" checked={settings.publish_reservations_count}
            onChange={(v) => patch("publish_reservations_count", v)} />
          <Toggle label="Publicar stats por cancha" checked={settings.publish_court_stats}
            onChange={(v) => patch("publish_court_stats", v)} />
          <Toggle label="Publicar historial" checked={settings.publish_history}
            onChange={(v) => patch("publish_history", v)} />
          <Toggle label="Publicar promociones" checked={settings.publish_promotions}
            onChange={(v) => patch("publish_promotions", v)} />
        </CardContent>
      </Card>

      {/* Equipo y Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Equipo y Staff
          </CardTitle>
          <CardDescription>
            Invitá empleados por email (rol Operador) o suspendé su acceso cuando corresponda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={inviteStaff} className="grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]">
            <Input
              placeholder="Nombre (ej: Sofía)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="empleado@club.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <Button type="submit" size="sm" variant="outline" className="gap-1.5">
              <UserPlus className="size-3.5" />
              Invitar
            </Button>
          </form>

          <div className="divide-y rounded-lg border">
            {staff.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">
                    {m.name}{" "}
                    <Badge variant="secondary" className="ml-1.5">
                      {m.role === "owner" ? "Dueño" : "Operador"}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                {m.role !== "owner" && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${m.active ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {m.active ? "Activo" : "Suspendido"}
                    </span>
                    <Switch checked={m.active} onCheckedChange={() => toggleStaffStatus(m.id)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} className="gap-2">
          <Save className="size-4" /> Guardar configuración
        </Button>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: unknown; onChange: (n: number) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}