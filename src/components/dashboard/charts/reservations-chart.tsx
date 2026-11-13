"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import type { DayKpi } from "@/lib/demo-data";

const chartConfig = {
  reservations: { label: "Reservas", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ReservationsChart({ data }: { data: DayKpi[] }) {
  const total = data.reduce((sum, d) => sum + d.reservations, 0);
  const avg = data.length ? Math.round((total / data.length) * 10) / 10 : 0;
  const peak = data.length
    ? data.reduce((best, d) => (d.reservations > best.reservations ? d : best), data[0]!)
    : undefined;

  return (
    <div className="space-y-2">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={data} margin={{ left: -16, right: 12, top: 12 }}>
          <defs>
            <linearGradient id="resAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.38} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="var(--chart-1)"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
            />
          )}
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
          />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Fecha: ${String(label)}`}
                formatter={(value) => `${formatNumber(Number(value ?? 0))} reservas`}
              />
            }
          />
          <Area
            dataKey="reservations"
            type="monotone"
            fill="url(#resAreaGrad)"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: "var(--background)",
              fill: "var(--chart-1)",
            }}
            isAnimationActive
            animationDuration={850}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>
          Total: <strong className="font-medium text-foreground">{formatNumber(total)}</strong> reservas · Promedio{" "}
          <strong className="font-medium text-foreground">{avg}</strong>/día
        </span>
        {peak && (
          <span className="font-medium text-emerald-700 dark:text-[color:var(--chart-1)]">
            Pico: {peak.label} ({peak.reservations})
          </span>
        )}
      </div>
    </div>
  );
}
