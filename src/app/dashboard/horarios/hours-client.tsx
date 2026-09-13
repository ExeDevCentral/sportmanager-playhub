"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { OperatingHourView } from "@/services/settings";
import type { SettingsData } from "@/services/settings";
import { toast } from "sonner";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function HoursClient({ data }: { data: SettingsData }) {
  const [hours, setHours] = React.useState<OperatingHourView[]>(data.operatingHours);

  const update = (dow: number, patch: Partial<OperatingHourView>) => {
    setHours((prev) => prev.map((h) => (h.day_of_week === dow ? { ...h, ...patch } : h)));
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Clock className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Horarios</h1>
          <p className="text-sm text-muted-foreground">Apertura y cierre por día (aplica a todas las canchas).</p>
        </div>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="text-base">Semana</CardTitle>
            <CardDescription>Domingo a sábado · formato 24 h</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hours.map((h) => (
              <div key={h.day_of_week} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="w-28 text-sm font-medium">{DAY_NAMES[h.day_of_week]}</div>
                <Switch
                  checked={!h.is_closed}
                  onCheckedChange={(v) => update(h.day_of_week, { is_closed: !v })}
                />
                {h.is_closed ? (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      value={h.opens_at}
                      onChange={(e) => update(h.day_of_week, { opens_at: e.target.value })}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">a</span>
                    <Input
                      type="time"
                      value={h.closes_at}
                      onChange={(e) => update(h.day_of_week, { closes_at: e.target.value })}
                      className="w-28"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm" onClick={() => toast.success("Horarios guardados", { description: "Los cambios quedan aplicados en esta sesión demo." })}>
              Guardar horarios
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}