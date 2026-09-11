"use client";

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
  const average = data.length ? data.reduce((sum, court) => sum + court.occupancy, 0) / data.length : 0;
  const lowest = data.length ? data.reduce((worst, court) => (court.occupancy < worst.occupancy ? court : worst), data[0]!) : undefined;
  const chartData = data.map((court, index) => ({
    ...court,
    previousOccupancy: court.previousOccupancy ?? Math.max(0, court.occupancy - [3, -2, 4, 1][index % 4]!),
    capacityHours: court.capacityHours ?? 300,
    courtLabel: `${court.court} ${court.occupancy - (court.previousOccupancy ?? Math.max(0, court.occupancy - [3, -2, 4, 1][index % 4]!)) >= 0 ? "↑" : "↓"}${Math.abs(court.occupancy - (court.previousOccupancy ?? Math.max(0, court.occupancy - [3, -2, 4, 1][index % 4]!)))}%`,
  }));

  const totalCapacity = chartData.reduce((sum, court) => sum + court.capacityHours, 0);
  const usedCapacity = chartData.reduce((sum, court) => sum + Math.round((court.capacityHours * court.occupancy) / 100), 0);

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 44, top: 8 }}>
        <YAxis
          dataKey="courtLabel"
          type="category"
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <XAxis type="number" hide domain={[0, 100]} />
        <ReferenceLine x={average} stroke="var(--color-primary)" strokeDasharray="5 5" label={{ value: `Promedio ${Math.round(average)}%`, position: "top", fill: "var(--color-foreground)", fontSize: 10 }} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
          {chartData.map((court) => (
            <Cell key={court.court} fill={court.court === lowest?.court ? "var(--color-muted-foreground)" : "var(--color-occupancy)"} />
          ))}
          <LabelList
            dataKey="occupancy"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(v: unknown) => `${Math.round(Number(v))}%`}
          />
        </Bar>
      </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>{usedCapacity} de {totalCapacity} hs ocupadas</span>
        {lowest && <span>Atención: {lowest.court} tiene la menor ocupación</span>}
      </div>
    </div>
  );
}
