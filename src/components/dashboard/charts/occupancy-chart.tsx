"use client";

import * as React from "react";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CourtStat } from "@/lib/demo-data";

const chartConfig = {
  occupancy: { label: "Ocupación", color: "var(--chart-3)" },
  court: { label: "Cancha" },
} satisfies ChartConfig;

export function OccupancyChart({ data }: { data: CourtStat[] }) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const average = data.length
    ? data.reduce((sum, court) => sum + court.occupancy, 0) / data.length
    : 0;
  const lowest = data.length
    ? data.reduce((worst, court) => (court.occupancy < worst.occupancy ? court : worst), data[0]!)
    : undefined;

  const chartData = data.map((court, index) => {
    const prev = court.previousOccupancy ?? Math.max(0, court.occupancy - [3, -2, 4, 1][index % 4]!);
    const delta = Math.round(court.occupancy - prev);
    return {
      ...court,
      delta,
      capacityHours: court.capacityHours ?? 300,
      courtLabel: `${court.court} ${delta >= 0 ? "↑" : "↓"}${Math.abs(delta)}%`,
    };
  });

  const totalCapacity = chartData.reduce((sum, court) => sum + court.capacityHours, 0);
  const usedCapacity = chartData.reduce(
    (sum, court) => sum + Math.round((court.capacityHours * court.occupancy) / 100),
    0,
  );

  return (
    <div className="space-y-2">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 48, top: 16, bottom: 4 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="occBarNormal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.75} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="occBarAttention" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--dashboard-attention)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="var(--dashboard-attention)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <YAxis
            dataKey="courtLabel"
            type="category"
            tickLine={false}
            axisLine={false}
            width={88}
            tick={{ fontSize: 12 }}
          />
          <XAxis type="number" hide domain={[0, 100]} />
          <ReferenceLine
            x={average}
            stroke="var(--color-primary)"
            strokeDasharray="5 5"
            label={{
              value: `Prom. ${Math.round(average)}%`,
              position: "top",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => {
                  const delta = item?.payload?.delta ?? 0;
                  const sign = delta >= 0 ? `+${delta}%` : `${delta}%`;
                  return `${Math.round(Number(value ?? 0))}% ocupación (${sign} vs mes ant.)`;
                }}
              />
            }
          />
          <Bar
            dataKey="occupancy"
            radius={[6, 6, 6, 6]}
            barSize={22}
            background={{ fill: "var(--muted)", fillOpacity: 0.35, radius: 6 }}
            isAnimationActive
            animationDuration={750}
            animationEasing="ease-out"
            onMouseEnter={(_, idx) => setHoveredIdx(idx)}
          >
            {chartData.map((court, idx) => (
              <Cell
                key={court.court}
                fill={
                  court.court === lowest?.court
                    ? "url(#occBarAttention)"
                    : "url(#occBarNormal)"
                }
                fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45}
                className="transition-opacity duration-200"
              />
            ))}
            <LabelList
              dataKey="occupancy"
              position="right"
              offset={8}
              className="fill-foreground font-medium tabular-nums"
              fontSize={12}
              formatter={(v: unknown) => `${Math.round(Number(v))}%`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>
          <strong className="font-medium text-foreground">{usedCapacity}</strong> de {totalCapacity} hs ocupadas
        </span>
        {lowest && (
          <span className="text-amber-700 dark:text-amber-300">
            Oportunidad: {lowest.court} ({Math.round(lowest.occupancy)}%)
          </span>
        )}
      </div>
    </div>
  );
}
