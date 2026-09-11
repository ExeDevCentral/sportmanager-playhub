import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function SectionPlaceholder({
  title,
  description,
  phase,
  icon: Icon,
}: {
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 border-dashed px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-6 text-muted-foreground" />
          </div>
          <Badge variant="secondary">En construcción · Fase {phase}</Badge>
          <p className="max-w-md text-sm text-muted-foreground">
            Esta sección forma parte de la Fase {phase} del roadmap. La navegación y el esquema de
            datos ya están listos; la funcionalidad se implementará sobre las migraciones
            0001–0010.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
