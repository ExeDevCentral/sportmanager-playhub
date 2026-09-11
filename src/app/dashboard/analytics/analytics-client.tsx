"use client";

import * as React from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PeakHoursChart } from "@/components/dashboard/charts/peak-hours-chart";
import { ReservationsChart } from "@/components/dashboard/charts/reservations-chart";
import { formatCurrency, formatNumber } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import type { DashboardData } from "@/lib/demo-data";
import type { CustomerStats } from "@/types/database";

export function AnalyticsClient({
  data,
  customers,
}: {
  data: DashboardData;
  customers: CustomerStats[];
}) {
  const insights = React.useMemo(() => {
    const days = data.last30Days;
    const cur = days.slice(-7);
    const prev = days.slice(-14, -7);

    const sum = (arr: typeof cur, key: "revenue" | "reservations") =>
      arr.reduce((s, d) => s + d[key], 0);

    const curRevenue = sum(cur, "revenue");
    const prevRevenue = sum(prev, "revenue");
    const curRes = sum(cur, "reservations");
    const prevRes = sum(prev, "reservations");

    const growthRevenue = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const growthReservations = prevRes > 0 ? ((curRes - prevRes) / prevRes) * 100 : 0;

    const avgOccupancy =
      data.courts.reduce((s, c) => s + c.occupancy, 0) / (data.courts.length || 1);

    const topCustomer = [...customers].sort((a, b) => b.total_spent - a.total_spent)[0];

    const segments = {
      active: customers.filter((c) => c.status === "active").length,
      inactive: customers.filter((c) => c.status === "inactive").length,
      blocked: customers.filter((c) => c.status === "blocked").length,
    };

    return {
      curRevenue,
      prevRevenue,
      curRes,
      growthRevenue,
      growthReservations,
      avgOccupancy,
      topCustomer,
      segments,
    };
  }, [data, customers]);

  const topCustomers = React.useMemo(
    () => [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5),
    [customers],
  );

  const handleExport = () => {
    downloadCSV(
      `analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Cliente", "Reservas", "Total gastado", "Estado", "Espacio favorito"],
      topCustomers.map((c) => [
        `${c.first_name} ${c.last_name}`,
        c.reservations_count,
        c.total_spent,
        c.status,
        c.favorite_court_name ?? "—",
      ]),
    );
    toast.success("Analytics exportado", {
      description: "Top de clientes en CSV.",
    });
  };

  const growthBadge = (value: number) =>
    value > 5 ? (
      <Badge className="gap-1 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10">
        <TrendingUp className="size-3" />+{formatNumber(Math.round(value))}%
      </Badge>
    ) : value < -5 ? (
      <Badge className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/10">
        <TrendingDown className="size-3" />{formatNumber(Math.round(value))}%
      </Badge>
    ) : (
      <Badge variant="secondary">{formatNumber(Math.round(value))}%</Badge>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Tendencias, demanda y comportamiento de clientes.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos · última semana
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">{formatCurrency(insights.curRevenue)}</span>
            {growthBadge(insights.growthRevenue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reservas · última semana
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">{formatNumber(insights.curRes)}</span>
            {growthBadge(insights.growthReservations)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupación promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {formatNumber(Math.round(insights.avgOccupancy))}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mejor cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm font-medium">
              {insights.topCustomer
                ? `${insights.topCustomer.first_name} ${insights.topCustomer.last_name}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {insights.topCustomer ? formatCurrency(insights.topCustomer.total_spent) : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Horarios más demandados</CardTitle></CardHeader>
          <CardContent><PeakHoursChart data={data.peakHours} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Reservas · últimos 30 días</CardTitle></CardHeader>
          <CardContent><ReservationsChart data={data.last30Days} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top 5 clientes por gasto</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Reservas</TableHead>
                  <TableHead className="text-right">Total gastado</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Sin clientes.
                    </TableCell>
                  </TableRow>
                )}
                {topCustomers.map((c) => (
                  <TableRow key={c.customer_id}>
                    <TableCell className="font-medium">
                      {c.first_name} {c.last_name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.reservations_count}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(c.total_spent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          c.status === "active"
                            ? "default"
                            : c.status === "inactive"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {c.status === "active" ? "Activo" : c.status === "inactive" ? "Inactivo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Segmentación de clientes</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {[
              { label: "Activos", value: insights.segments.active, tone: "text-emerald-600 dark:text-emerald-400" },
              { label: "Inactivos", value: insights.segments.inactive, tone: "text-amber-600 dark:text-amber-400" },
              { label: "Bloqueados", value: insights.segments.blocked, tone: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`text-lg font-semibold tabular-nums ${s.tone}`}>{s.value}</span>
              </div>
            ))}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(customers.length)} clientes en total.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}