"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="demand" fill="var(--color-demand)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
