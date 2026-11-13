"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3, Check, Code2, Copy, Database, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReservationsChart } from "@/components/dashboard/charts/reservations-chart";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { OccupancyChart } from "@/components/dashboard/charts/occupancy-chart";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import type { DashboardData } from "@/lib/demo-data";
import type { PaymentsData } from "@/services/payments";

const courtChartConfig = {
  revenue: { label: "Ingresos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ReportesClient({
  data,
  payments,
}: {
  data: DashboardData;
  payments: PaymentsData;
}) {
  const [biDataset, setBiDataset] = React.useState<"daily" | "courts" | "payments" | "customers">("daily");
  const [copiedKind, setCopiedKind] = React.useState<"url" | "m" | null>(null);

  const biFeedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/bi/feed?dataset=${biDataset}&format=csv`
      : `/api/bi/feed?dataset=${biDataset}&format=csv`;

  const biJsonUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/bi/feed?dataset=${biDataset}&format=json`
      : `/api/bi/feed?dataset=${biDataset}&format=json`;

  const powerQueryScript = `let
  Origen = Json.Document(Web.Contents("${biJsonUrl}")),
  Filas = Origen[rows],
  Tabla = Table.FromRecords(Filas)
in
  Tabla`;

  const copyToClipboard = async (text: string, kind: "url" | "m", label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      toast.success(label);
      setTimeout(() => setCopiedKind(null), 2000);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  const totals = React.useMemo(() => {
    const revenue = data.last30Days.reduce((s, d) => s + d.revenue, 0);
    const reservations = data.last30Days.reduce((s, d) => s + d.reservations, 0);
    const cancellations = data.last30Days.reduce((s, d) => s + d.cancellations, 0);
    const noShows = data.last30Days.reduce((s, d) => s + d.noShows, 0);
    return {
      revenue,
      reservations,
      cancellations,
      noShows,
      ticket: reservations > 0 ? Math.round(revenue / reservations) : 0,
      cancelRate: reservations > 0 ? cancellations / reservations : 0,
      noShowRate: reservations > 0 ? noShows / reservations : 0,
    };
  }, [data.last30Days]);

  const courtRanking = React.useMemo(() => {
    const totalRevenue = data.courts.reduce((s, c) => s + c.revenue, 0) || 1;
    return data.courts
      .map((c) => ({ ...c, pct: c.revenue / totalRevenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data.courts]);

  const handleExport = () => {
    downloadCSV(
      `reporte-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Concepto", "Valor"],
      [
        ["Ingresos (30 días)", totals.revenue],
        ["Reservas (30 días)", totals.reservations],
        ["Cancelaciones", totals.cancellations],
        ["No shows", totals.noShows],
        ["Ticket promedio", totals.ticket],
        ["Tasa de cancelación", formatPercent(totals.cancelRate * 100)],
        ...courtRanking.flatMap((c) => [
          [`Ingresos · ${c.court}`, c.revenue],
          [`Reservas · ${c.court}`, c.reservations],
          [`Ocupación · ${c.court}`, `${Math.round(c.occupancy)}%`],
        ]),
      ],
    );
    toast.success("Reporte exportado", {
      description: "CSV listo para abrir en Excel.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Ingresos, ocupación y reservas del último mes, descargables.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 size-4" />
          Exportar Excel (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ingresos 30 días</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{formatCurrency(totals.revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reservas 30 días</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{formatNumber(totals.reservations)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ticket promedio</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{formatCurrency(totals.ticket)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tasa de cancelación</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{formatPercent(totals.cancelRate * 100)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Ingresos · últimos 30 días</CardTitle></CardHeader>
          <CardContent><RevenueChart data={data.last30Days} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Reservas · últimos 30 días</CardTitle></CardHeader>
          <CardContent><ReservationsChart data={data.last30Days} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Ocupación por espacio</CardTitle></CardHeader>
          <CardContent><OccupancyChart data={data.courts} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Ingresos por espacio</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={courtChartConfig} className="h-64 w-full">
              <BarChart data={courtRanking} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="court" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value ?? 0))} />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking por espacio</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead className="text-right">Ocupación</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">% del ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courtRanking.map((c) => (
                <TableRow key={c.court}>
                  <TableCell className="font-medium">{c.court}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(c.occupancy)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(c.reservations)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(c.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(c.pct * 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Conciliación de pagos</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Aprobado</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(payments.totals.approved)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Pendiente</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatCurrency(payments.totals.pending)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Reembolsado</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(payments.totals.refunded)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Rechazado</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-destructive">{formatCurrency(payments.totals.rejected)}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Conector Power BI / Excel Power Query ── */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <Database className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Conector Power BI &amp; Excel</CardTitle>
              <p className="text-xs text-muted-foreground">
                Copiá el enlace o el script Power Query (M) y pegalo en Power BI (Obtener datos → Web / Consulta en blanco).
              </p>
            </div>
          </div>
          <Select
            value={biDataset}
            onValueChange={(v) => setBiDataset(v as "daily" | "courts" | "payments" | "customers")}
          >
            <SelectTrigger className="w-56 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Ingresos y reservas diarios</SelectItem>
              <SelectItem value="courts">Rendimiento por cancha</SelectItem>
              <SelectItem value="payments">Pagos y conciliación</SelectItem>
              <SelectItem value="customers">Cartera de clientes</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                copyToClipboard(biFeedUrl, "url", "URL CSV copiada para Power BI / Excel")
              }
            >
              {copiedKind === "url" ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              Copiar URL Web (CSV)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                copyToClipboard(powerQueryScript, "m", "Script Power Query (M) copiado")
              }
            >
              {copiedKind === "m" ? <Check className="size-3.5 text-emerald-500" /> : <Code2 className="size-3.5" />}
              Copiar script Power Query (M)
            </Button>
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" asChild>
              <a href={biFeedUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" />
                Probar feed
              </a>
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {powerQueryScript}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}