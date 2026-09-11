"use client";

import * as React from "react";
import { Percent, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getSettingsData, DAY_NAMES, type PromotionView } from "@/services/settings";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

const TYPE_LABEL: Record<PromotionView["discount_type"], string> = {
  percent: "Porcentaje",
  fixed: "Monto fijo",
  two_for_one: "2x1",
  free_hours: "Horas gratis",
};

export function PromotionsClient() {
  const [promotions, setPromotions] = React.useState<PromotionView[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getSettingsData()
      .then((d) => {
        if (!cancelled) setPromotions(d.promotions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleActive = (id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)));
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
        <Button
          size="sm"
          onClick={() => {
            const id = `local-promotion-${Date.now()}`;
            setPromotions((prev) => [
              ...prev,
              {
                id,
                name: "Nueva promoción",
                description: "Promoción creada en modo demo.",
                discount_type: "percent",
                discount_value: 10,
                applies_days: null,
                valid_from: new Date().toISOString().slice(0, 10),
                valid_to: null,
                max_uses: null,
                used_count: 0,
                is_active: true,
                is_public: false,
              },
            ]);
            toast.success("Promoción creada", { description: "Podés activarla o desactivarla en esta sesión demo." });
          }}
        >
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
    </div>
  );
}