"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PeakHour } from "@/lib/demo-data";

const chartConfig = {
  demand: { label: "Turnos reservados", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function PeakHoursChart({ data }: { data: PeakHour[] }) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const totalDemand = data.reduce((sum, h) => sum + h.demand, 0);
  const sorted = [...data].sort((a, b) => b.demand - a.demand);
  const peakThreshold = sorted[2]?.demand ?? sorted[0]?.demand ?? 0;
  const valleyThreshold = sorted[sorted.length - 3]?.demand ?? 0;

  const peakHours = sorted.slice(0, 2).map((h) => h.hour);
  const valleyHour = sorted[sorted.length - 1]?.hour;

  return (
    <div className="space-y-2">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart
          data={data}
          margin={{ left: -16, right: 8, top: 12 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="peakBarHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="peakBarMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="peakBarLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.2 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  const demand = Number(payload?.[0]?.value ?? 0);
                  const tag =
                    demand >= peakThreshold
                      ? "Hora pico · tarifa alta"
                      : demand <= valleyThreshold
                        ? "Horario valle · ideal promo"
                        : "Demanda media";
                  return `${String(label)} hs · ${tag}`;
                }}
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  const pct = totalDemand ? Math.round((v / totalDemand) * 100) : 0;
                  return `${v} turnos (${pct}% del día)`;
                }}
              />
            }
          />
          <Bar
            dataKey="demand"
            radius={[5, 5, 0, 0]}
            isAnimationActive
            animationDuration={750}
            animationEasing="ease-out"
            onMouseEnter={(_, idx) => setHoveredIdx(idx)}
          >
            {data.map((entry, idx) => {
              const fill =
                entry.demand >= peakThreshold
                  ? "url(#peakBarHot)"
                  : entry.demand <= valleyThreshold
                    ? "url(#peakBarLow)"
                    : "url(#peakBarMid)";
              return (
                <Cell
                  key={entry.hour}
                  fill={fill}
                  fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45}
                  className="transition-opacity duration-200"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-[var(--chart-1)]" />
          Pico: <strong className="font-medium text-foreground">{peakHours.join(" y ")} hs</strong>
        </span>
        {valleyHour && (
          <span>
            Valle (para promo): <strong className="font-medium text-foreground">{valleyHour} hs</strong>
          </span>
        )}
      </div>
    </div>
  );
}
