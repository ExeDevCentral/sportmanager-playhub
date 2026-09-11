"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
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
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 8 }}>
        <YAxis
          dataKey="court"
          type="category"
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <XAxis type="number" hide domain={[0, 100]} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="occupancy"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(v) => `${Math.round(Number(v))}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
