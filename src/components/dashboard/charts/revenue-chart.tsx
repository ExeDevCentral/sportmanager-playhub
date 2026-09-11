"use client";

import { Bar, BarChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { DayKpi } from "@/lib/demo-data";

const chartConfig = {
  revenue: { label: "Ingresos", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: DayKpi[] }) {
  const average = data.length ? data.reduce((sum, day) => sum + day.revenue, 0) / data.length : 0;
  const max = data.length ? data.reduce((best, day) => (day.revenue > best.revenue ? day : best), data[0]!) : undefined;
  const min = data.length ? data.reduce((worst, day) => (day.revenue < worst.revenue ? day : worst), data[0]!) : undefined;
  const maxRevenue = max?.revenue ?? 0;
  const chartData = data.map((day) => ({ ...day, isWeekend: [0, 5, 6].includes(new Date(`${day.date}T12:00:00`).getDay()) }));

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData} margin={{ left: -8, right: 76, top: 12, bottom: 8 }}>
        {chartData.filter((day) => day.isWeekend).map((day) => (
          <ReferenceArea
            key={day.date}
            x1={day.label}
            x2={day.label}
            y1={0}
            y2={maxRevenue}
            fill="var(--color-muted)"
            fillOpacity={0.28}
            ifOverflow="visible"
          />
        ))}
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <ReferenceLine
          y={average}
          stroke="var(--color-primary)"
          strokeDasharray="5 5"
          label={{ value: `Promedio ${formatCurrency(average)}`, position: "right", fill: "var(--color-foreground)", fontSize: 10 }}
        />
        {max && <ReferenceLine x={max.label} stroke="var(--color-chart-1)" strokeDasharray="2 3" />}
        {min && <ReferenceLine x={min.label} stroke="var(--color-muted-foreground)" strokeDasharray="2 3" />}
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Fecha: ${String(label)}`}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} />
      </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground">
        {max && <span className="text-[color:var(--chart-1)]">Pico: {max.label} · {formatCurrency(max.revenue)}</span>}
        {min && <span>Valle: {min.label} · {formatCurrency(min.revenue)}</span>}
        <span>Fin de semana: sombreado</span>
      </div>
    </div>
  );
}
