import {
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  DoorOpen,
  Gauge,
  UserPlus,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { TodayKpis } from "@/lib/demo-data";

type KpiCard = {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  accent?: "positive" | "negative" | "neutral";
};

export function KpiCards({ today }: { today: TodayKpis }) {
  const cards: KpiCard[] = [
    {
      label: "Reservas hoy",
      value: formatNumber(today.reservationsToday),
      caption: `${formatNumber(today.confirmedToday)} confirmadas`,
      icon: CalendarDays,
    },
    {
      label: "Confirmadas",
      value: formatNumber(today.confirmedToday),
      icon: CalendarCheck,
      accent: "positive",
    },
    {
      label: "Ingresos del día",
      value: formatCurrency(today.revenueToday),
      icon: CircleDollarSign,
      accent: "positive",
    },
    {
      label: "Ocupación",
      value: formatPercent(today.occupancyToday),
      icon: Gauge,
    },
    {
      label: "Canchas disponibles",
      value: `${today.availableCourtsNow}/${today.totalCourts}`,
      caption: "en este momento",
      icon: DoorOpen,
    },
    {
      label: "Cancelaciones",
      value: formatNumber(today.cancellationsToday),
      icon: XCircle,
      accent: today.cancellationsToday > 3 ? "negative" : "neutral",
    },
    {
      label: "No shows",
      value: formatNumber(today.noShowsToday),
      icon: UserX,
      accent: today.noShowsToday > 1 ? "negative" : "neutral",
    },
    {
      label: "Clientes nuevos",
      value: formatNumber(today.newCustomersToday),
      caption: "hoy",
      icon: UserPlus,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <Icon
                  className={
                    card.accent === "negative"
                      ? "size-4 text-destructive"
                      : card.accent === "positive"
                        ? "size-4 text-emerald-600 dark:text-emerald-400"
                        : "size-4 text-muted-foreground"
                  }
                />
              </div>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">{card.value}</p>
              {card.caption && (
                <p className="text-xs text-muted-foreground">{card.caption}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
