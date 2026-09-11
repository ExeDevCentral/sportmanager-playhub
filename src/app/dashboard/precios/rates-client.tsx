"use client";

import * as React from "react";
import { Banknote, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getSettingsData, type RateView } from "@/services/settings";
import { formatCurrency } from "@/lib/format";

export function RatesClient() {
  const [rates, setRates] = React.useState<RateView[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getSettingsData()
      .then((d) => {
        if (!cancelled) setRates(d.rates);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const updatePrice = (id: string, price: number) => {
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, price } : r)));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Precios</h1>
            <p className="text-sm text-muted-foreground">Tarifas por cancha, día y franja horaria.</p>
          </div>
        </div>
        <Button size="sm"><Plus className="mr-1 size-4" /> Agregar tarifa</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Cargando tarifas…
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarifas activas</CardTitle>
            <CardDescription>El precio final se resuelve con la regla de mayor prioridad (fn_resolve_price).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rates.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium">{r.name ?? "Tarifa"}</p>
                  <p className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {r.court_id ? <Badge variant="outline">Cancha {r.court_id.slice(1)}</Badge> : null}
                    {r.day_of_week != null && <Badge variant="outline">{["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][r.day_of_week]}s</Badge>}
                    {r.starts_from ? (
                      <span>
                        {r.starts_from}–{r.ends_to ?? "cierre"}
                      </span>
                    ) : (
                      <span>Todo el día</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={r.price}
                      onChange={(e) => updatePrice(r.id, Number(e.target.value) || 0)}
                      className="w-28 text-right tabular-nums"
                    />
                  </div>
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => setRates((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: v } : x)))}
                  />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">
              Ej: {rates[0] ? `${rates[0].name ?? "Tarifa"} = ${formatCurrency(rates[0].price)}` : ""}
            </p>
            <Button size="sm">Guardar tarifas</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}