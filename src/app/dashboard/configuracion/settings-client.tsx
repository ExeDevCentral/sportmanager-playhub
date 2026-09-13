"use client";

import * as React from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { CourtView } from "@/services/settings";
import type { SettingsData } from "@/services/settings";
import type { ComplexSettings } from "@/types/database";

export function SettingsClient({ data }: { data: SettingsData }) {
  const [settings, setSettings] = React.useState<ComplexSettings>(data.settings);
  const [complexName, setComplexName] = React.useState(data.complexName);
  const [courts] = React.useState<CourtView[]>(data.courts);

  const patch = (key: keyof ComplexSettings, value: unknown) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const save = () => {
    toast.success("Configuración guardada", { description: "Modo demo: los cambios no persisten aún." });
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