"use client";

import * as React from "react";
import { Percent, Loader2, Plus, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getSettingsData, DAY_NAMES, type PromotionView } from "@/services/settings";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABEL: Record<PromotionView["discount_type"], string> = {
  percent: "Porcentaje",
  fixed: "Monto fijo",
  two_for_one: "2x1",
  free_hours: "Horas gratis",
};

export function PromotionsClient() {
  const [promotions, setPromotions] = React.useState<PromotionView[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    discount_type: "percent" as PromotionView["discount_type"],
    discount_value: "10",
    valid_from: new Date().toISOString().slice(0, 10),
    valid_to: "",
    max_uses: "",
    applies_days: [] as number[],
  });

  React.useEffect(() => {
    let cancelled = false;
    getSettingsData()
      .then((d) => {
        if (!cancelled) {
          const saved = window.localStorage.getItem("sportmanager-demo-promotions");
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as PromotionView[];
              if (Array.isArray(parsed)) {
                setPromotions(parsed);
                return;
              }
            } catch {
              window.localStorage.removeItem("sportmanager-demo-promotions");
            }
          }
          setPromotions(d.promotions);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleActive = (id: string) => {
    setPromotions((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p));
      window.localStorage.setItem("sportmanager-demo-promotions", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Promociones</h1>
            <p className="text-sm text-muted-foreground">Descuentos por día y franja horaria.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 size-4" /> Nueva promoción
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Cargando promociones…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promotions.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <CardDescription className="mt-1">{p.description ?? "—"}</CardDescription>
                  </div>
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{TYPE_LABEL[p.discount_type]}</Badge>
                  {p.discount_type === "percent" && p.discount_value != null && (
                    <Badge variant="outline">{p.discount_value}% off</Badge>
                  )}
                  {p.discount_type === "fixed" && p.discount_value != null && (
                    <Badge variant="outline">${p.discount_value.toLocaleString("es-AR")} off</Badge>
                  )}
                  {p.applies_days?.map((d) => (
                    <Badge key={d} variant="secondary">{DAY_NAMES[d]}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(p.used_count)}
                  {p.max_uses != null ? ` de ${formatNumber(p.max_uses)} usos` : " usos"} · vigencia
                  {p.valid_to ? ` hasta ${p.valid_to}` : " indefinida"}
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">
                  {p.is_public ? "Visible en el sitio" : "Solo admin"}
                </span>
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id)} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear promoción</DialogTitle>
            <DialogDescription>Definí las condiciones que se aplicarán en la reserva demo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="promotion-name">Nombre</Label>
              <Input id="promotion-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Happy hour de lunes" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotion-description">Descripción</Label>
              <Input id="promotion-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Condición visible para el equipo" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo de descuento</Label>
                <Select value={form.discount_type} onValueChange={(value) => setForm({ ...form, discount_type: value as PromotionView["discount_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje</SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                    <SelectItem value="two_for_one">2x1</SelectItem>
                    <SelectItem value="free_hours">Horas gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promotion-value">Valor {form.discount_type === "percent" ? "(%)" : ""}</Label>
                <Input id="promotion-value" type="number" min="0" value={form.discount_value} disabled={form.discount_type === "two_for_one"} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="promotion-from">Desde</Label>
                <Input id="promotion-from" type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promotion-to">Hasta (opcional)</Label>
                <Input id="promotion-to" type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotion-max">Límite de usos (opcional)</Label>
              <Input id="promotion-max" type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Sin límite" />
            </div>
            <div className="grid gap-2">
              <Label>Días aplicables</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((day, index) => (
                  <Button key={day} type="button" variant={form.applies_days.includes(index) ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, applies_days: form.applies_days.includes(index) ? form.applies_days.filter((value) => value !== index) : [...form.applies_days, index] })}>
                    <CalendarDays className="mr-1 size-3" /> {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!form.name.trim()) {
                toast.error("Falta el nombre", { description: "Ingresá un nombre para la promoción." });
                return;
              }
              const created: PromotionView = {
                id: `local-promotion-${Date.now()}`,
                name: form.name.trim(),
                description: form.description.trim() || null,
                discount_type: form.discount_type,
                discount_value: form.discount_type === "two_for_one" ? null : Number(form.discount_value) || 0,
                applies_days: form.applies_days.length ? form.applies_days.sort((a, b) => a - b) : null,
                valid_from: form.valid_from,
                valid_to: form.valid_to || null,
                max_uses: form.max_uses ? Number(form.max_uses) : null,
                used_count: 0,
                is_active: true,
                is_public: false,
              };
              setPromotions((prev) => {
                const next = [...prev, created];
                window.localStorage.setItem("sportmanager-demo-promotions", JSON.stringify(next));
                return next;
              });
              toast.success("Promoción creada", { description: "Los parámetros quedaron guardados en esta sesión demo." });
              setCreateOpen(false);
              setForm({ name: "", description: "", discount_type: "percent", discount_value: "10", valid_from: new Date().toISOString().slice(0, 10), valid_to: "", max_uses: "", applies_days: [] });
            }}>Guardar promoción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}