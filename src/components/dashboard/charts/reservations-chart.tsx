"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DayKpi } from "@/lib/demo-data";

const chartConfig = {
  reservations: { label: "Reservas", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ReservationsChart({ data }: { data: DayKpi[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="reservations"
          type="natural"
          fill="var(--color-reservations)"
          fillOpacity={0.2}
          stroke="var(--color-reservations)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
