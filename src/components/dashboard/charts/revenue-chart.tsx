"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
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
  movingAvg: { label: "Media móvil 7d", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: DayKpi[] }) {
  const [showTrend, setShowTrend] = React.useState(true);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const average = data.length
    ? data.reduce((sum, day) => sum + day.revenue, 0) / data.length
    : 0;
  const max = data.length
    ? data.reduce((best, day) => (day.revenue > best.revenue ? day : best), data[0]!)
    : undefined;
  const min = data.length
    ? data.reduce((worst, day) => (day.revenue < worst.revenue ? day : worst), data[0]!)
    : undefined;

  const chartData = React.useMemo(
    () =>
      data.map((day, idx) => {
        const windowSlice = data.slice(Math.max(0, idx - 6), idx + 1);
        const movingAvg = Math.round(
          windowSlice.reduce((s, d) => s + d.revenue, 0) / windowSlice.length,
        );
        const isWeekend = [0, 5, 6].includes(new Date(`${day.date}T12:00:00`).getDay());
        return {
          ...day,
          movingAvg,
          isWeekend,
        };
      }),
    [data],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end px-1">
        <button
          type="button"
          onClick={() => setShowTrend((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
            showTrend
              ? "border-[var(--chart-4)]/40 bg-[var(--chart-4)]/10 text-foreground"
              : "border-border bg-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: "var(--chart-4)" }}
          />
          Tendencia 7 días
        </button>
      </div>

      <ChartContainer config={chartConfig} className="h-64 w-full">
        <ComposedChart
          data={chartData}
          margin={{ left: -8, right: 84, top: 12, bottom: 8 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="revBarRegular" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.45} />
            </linearGradient>
            <linearGradient id="revBarWeekend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.55} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine
            y={average}
            stroke="var(--color-primary)"
            strokeDasharray="5 5"
            strokeOpacity={0.8}
            label={{
              value: `Prom. ${formatCurrency(average)}`,
              position: "right",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          {max && (
            <ReferenceLine
              x={max.label}
              stroke="var(--chart-1)"
              strokeDasharray="2 3"
              strokeOpacity={0.6}
            />
          )}
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.2 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  if (!item) return `Fecha: ${String(label)}`;
                  const diffPct = average
                    ? Math.round(((item.revenue - average) / average) * 100)
                    : 0;
                  const diffLabel =
                    diffPct >= 0 ? `+${diffPct}% vs prom.` : `${diffPct}% vs prom.`;
                  return `${String(label)}${item.isWeekend ? " · Fin de semana" : ""} (${diffLabel})`;
                }}
                formatter={(value, name) => {
                  const label = name === "movingAvg" ? "Media móvil 7d" : "Ingresos";
                  return `${label}: ${formatCurrency(Number(value ?? 0))}`;
                }}
              />
            }
          />
          <Bar
            dataKey="revenue"
            radius={[5, 5, 0, 0]}
            isAnimationActive
            animationDuration={750}
            animationEasing="ease-out"
            onMouseEnter={(_, idx) => setHoveredIdx(idx)}
          >
            {chartData.map((day, idx) => (
              <Cell
                key={day.date}
                fill={day.isWeekend ? "url(#revBarWeekend)" : "url(#revBarRegular)"}
                fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45}
                className="transition-opacity duration-200"
              />
            ))}
          </Bar>

          {showTrend && (
            <Line
              type="monotone"
              dataKey="movingAvg"
              stroke="var(--chart-4)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
              isAnimationActive
              animationDuration={950}
              animationEasing="ease-out"
            />
          )}
        </ComposedChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground">
        {max && (
          <span className="font-medium text-emerald-700 dark:text-[color:var(--chart-1)]">
            Pico: {max.label} · {formatCurrency(max.revenue)}
          </span>
        )}
        {min && (
          <span>
            Valle: {min.label} · {formatCurrency(min.revenue)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-[var(--chart-1)]" />
          Fin de semana
        </span>
        {showTrend && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded bg-[var(--chart-4)]" />
            Tendencia 7d
          </span>
        )}
      </div>
    </div>
  );
}
