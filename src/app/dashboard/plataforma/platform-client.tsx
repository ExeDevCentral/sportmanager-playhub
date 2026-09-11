"use client";

import { useRouter } from "next/navigation";
import { Building2, CreditCard, LogIn, TrendingUp, Users, Volleyball } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setDemoRole } from "@/lib/auth/actions";
import { downloadCSV } from "@/lib/csv";
import type { PlatformOverview } from "@/services/platform";

const STATUS_LABEL: Record<PlatformOverview["complexes"][number]["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  operativo: { label: "Operativo", variant: "default" },
  configuracion: { label: "En configuración", variant: "secondary" },
  pausa: { label: "En pausa", variant: "outline" },
};

const PLAN_LABEL = { starter: "Starter", pro: "Pro", enterprise: "Enterprise" } as const;

function money(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function PlatformClient({ data }: { data: PlatformOverview }) {
  const router = useRouter();

  const enterAsOwner = async (complexName: string) => {
    await setDemoRole("owner");
    router.push("/dashboard");
    setTimeout(() => {
      toast.success(`Viendo ${complexName} como Admin Dueño`);
    }, 150);
  };

  const exportCsv = () => {
    downloadCSV(
      `complejos-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Complejo", "Vertical", "Estado", "Canchas", "Reservas 30d", "Ingresos 30d", "Ocupación", "Plan"],
      data.complexes.map((c) => [
        c.name,
        c.vertical,
        STATUS_LABEL[c.status].label,
        c.courts,
        c.reservations30d,
        c.revenue30d,
        `${c.occupancy}%`,
        PLAN_LABEL[c.plan],
      ]),
    );
  };

  const kpis = [
    { label: "Complejos", value: String(data.totalComplexes), icon: Building2 },
    { label: "Canchas", value: String(data.totalCourts), icon: Volleyball },
    { label: "Clientes", value: String(data.totalCustomers), icon: Users },
    { label: "Reservas 30d", value: String(data.reservations30d), icon: CreditCard },
    { label: "Ingresos 30d", value: money(data.revenue30d), icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin Plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Estado general de todos los complejos operados con SportManager/PlayHub.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Exportar completos
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <k.icon className="size-4" /> {k.label}
              </div>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">Complejos</CardTitle>
            <CardDescription>Ocupación y volumen de los últimos 30 días por complejo.</CardDescription>
          </div>
          <Badge variant="secondary">Ocupación promedio {data.avgOccupancy}%</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complejo</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Canchas</TableHead>
                <TableHead>Reservas 30d</TableHead>
                <TableHead>Ingresos 30d</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.complexes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.owners} dueño{c.owners === 1 ? "" : "s"} · {(PLAN_LABEL as Record<string, string>)[c.plan]} · {c.customers} clientes
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.vertical}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_LABEL[c.status].variant}>{STATUS_LABEL[c.status].label}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{c.courts}</TableCell>
                  <TableCell className="tabular-nums">{c.reservations30d}</TableCell>
                  <TableCell className="tabular-nums">{money(c.revenue30d)}</TableCell>
                  <TableCell className="text-right">
                    {c.status === "operativo" && (
                      <Button size="sm" variant="ghost" onClick={() => enterAsOwner(c.name)}>
                        <LogIn className="mr-1 size-3.5" /> Entrar como dueño
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}