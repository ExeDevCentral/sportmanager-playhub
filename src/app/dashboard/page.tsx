import type { Metadata } from "next";
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
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ReservationsChart } from "@/components/dashboard/charts/reservations-chart";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { OccupancyChart } from "@/components/dashboard/charts/occupancy-chart";
import { PeakHoursChart } from "@/components/dashboard/charts/peak-hours-chart";
import { formatCurrency, greeting } from "@/lib/format";
import { formatNumber } from "@/lib/format";
import { getDashboardData } from "@/services/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmada", variant: "default" },
  pending: { label: "Pendiente", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Completada", variant: "outline" },
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const totalRevenue = data.last30Days.reduce((sum, day) => sum + day.revenue, 0);
  const totalReservations = data.last30Days.reduce((sum, day) => sum + day.reservations, 0);
  const averageOccupancy = data.courts.length
    ? Math.round(data.courts.reduce((sum, court) => sum + court.occupancy, 0) / data.courts.length)
    : 0;
  const bestCourt = data.courts.length
    ? data.courts.reduce((best, court) => (court.revenue > best.revenue ? court : best), data.courts[0]!)
    : undefined;
  const firstHalfRevenue = data.last30Days.slice(0, 15).reduce((sum, day) => sum + day.revenue, 0);
  const secondHalfRevenue = data.last30Days.slice(15).reduce((sum, day) => sum + day.revenue, 0);
  const periodVariation = firstHalfRevenue ? Math.round(((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de hoy · {data.today.reservationsToday} reservas programadas
        </p>
      </div>

      <KpiCards today={data.today} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Ingreso acumulado", formatCurrency(totalRevenue), "últimos 30 días"],
          ["Ticket promedio", formatCurrency(totalReservations ? totalRevenue / totalReservations : 0), `${formatNumber(totalReservations)} reservas`],
          ["Cancha más rentable", bestCourt?.court ?? "—", bestCourt ? formatCurrency(bestCourt.revenue) : "Sin datos"],
          ["Ocupación general", `${averageOccupancy}%`, "promedio de canchas"],
        ].map(([label, value, caption]) => (
          <Card key={label} className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{caption}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas · últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ReservationsChart data={data.last30Days} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`mb-1 text-xs font-medium ${periodVariation >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {periodVariation >= 0 ? "↑" : "↓"} {Math.abs(periodVariation)}% vs. primeros 15 días
                </p>
                <CardTitle className="text-base">Ingresos · últimos 30 días</CardTitle>
              </div>
              <p className="text-xl font-semibold tracking-tight">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.last30Days} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Ocupación por cancha · este mes</CardTitle>
              <span className="text-xs text-muted-foreground">Promedio: {averageOccupancy}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={data.courts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horarios más demandados</CardTitle>
          </CardHeader>
          <CardContent>
            <PeakHoursChart data={data.peakHours} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Agenda de hoy</CardTitle>
          <Badge variant="secondary">{data.todaySchedule.length} turnos</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Hora</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.todaySchedule.map((row) => {
                const status = STATUS_LABEL[row.status] ?? STATUS_LABEL.pending!;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium tabular-nums">{row.time}</TableCell>
                    <TableCell>{row.court}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>
                      {row.paid ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Pagado
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Adeuda seña</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos por cancha · este mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.courts.map((c) => (
              <div key={c.court} className="rounded-lg border p-4">
                <p className="text-sm font-medium">{c.court}</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(c.revenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {c.reservations} reservas · {Math.round(c.occupancy)}% ocupación
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
