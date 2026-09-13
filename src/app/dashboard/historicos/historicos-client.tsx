"use client";

import * as React from "react";
import { Download, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { reloadHistory } from "./actions";
import { HISTORY_STATUS_LABEL } from "@/services/labels";
import type { HistoryRecord } from "@/services/history";
import type { ReservationStatus } from "@/types/database";

const STATUS_VARIANT: Record<ReservationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
  expired: "secondary",
  refunded: "outline",
};

const CHANNEL_LABEL: Record<HistoryRecord["channel"], string> = {
  online: "Online",
  manual: "Manual",
  import: "Excel",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function HistoricosClient({ initialHistory }: { initialHistory: HistoryRecord[] }) {
  const [records, setRecords] = React.useState<HistoryRecord[]>(initialHistory);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ReservationStatus>("all");
  const [channelFilter, setChannelFilter] = React.useState<"all" | HistoryRecord["channel"]>("all");

  const reload = () => {
    setLoading(true);
    reloadHistory()
      .then((h) => setRecords(h))
      .catch(() => {
        toast.error("No se pudo actualizar el histórico");
      })
      .finally(() => setLoading(false));
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        !q ||
        r.customer_name.toLowerCase().includes(q) ||
        r.court_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesChannel = channelFilter === "all" || r.channel === channelFilter;
      return matchesQuery && matchesStatus && matchesChannel;
    });
  }, [records, query, statusFilter, channelFilter]);

  const summaries = React.useMemo(() => {
    const income = records
      .filter((r) => r.paid_amount > 0)
      .reduce((s, r) => s + r.paid_amount, 0);
    const completed = records.filter((r) => r.status === "completed").length;
    const cancelled = records.filter((r) => r.status === "cancelled").length;
    const noShows = records.filter((r) => r.status === "no_show").length;
    const imported = records.filter((r) => r.channel === "import").length;
    return { total: records.length, income, completed, cancelled, noShows, imported };
  }, [records]);

  const handleExport = () => {
    downloadCSV(
      `historicos-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Fecha", "Hora", "Cancha", "Cliente", "Canal", "Estado", "Importe", "Pagado"],
      filtered.map((r) => [
        formatDate(r.starts_at),
        formatTime(r.starts_at),
        r.court_name,
        r.customer_name,
        CHANNEL_LABEL[r.channel],
        HISTORY_STATUS_LABEL[r.status] ?? r.status,
        r.price,
        r.paid_amount,
      ]),
    );
    toast.success("Histórico exportado", {
      description: `${filtered.length} registros en CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <History className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Históricos</h1>
            <p className="text-sm text-muted-foreground">
              Registro de últimos 60 días, incluyendo datos migrados desde Excel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Registros</p><p className="text-2xl font-semibold tabular-nums">{summaries.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ingresos cobrados</p><p className="text-2xl font-semibold tabular-nums">{formatCurrency(summaries.income)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Completados</p><p className="text-2xl font-semibold tabular-nums">{summaries.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cancelados</p><p className="text-2xl font-semibold tabular-nums">{summaries.cancelled}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Desde Excel</p><p className="text-2xl font-semibold tabular-nums">{summaries.imported}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por cliente o cancha…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | ReservationStatus)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
            <SelectItem value="no_show">No asistió</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as "all" | HistoryRecord["channel"])}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="import">Excel</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setQuery("");
            setStatusFilter("all");
            setChannelFilter("all");
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Registro histórico</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No se encontraron registros.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(r.starts_at)}</TableCell>
                  <TableCell className="font-medium tabular-nums">{formatTime(r.starts_at)}</TableCell>
                  <TableCell>{r.court_name}</TableCell>
                  <TableCell className="font-medium">{r.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant={r.channel === "import" ? "secondary" : "outline"}>
                      {CHANNEL_LABEL[r.channel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(r.price)}</TableCell>
                  <TableCell>
                    {r.paid_amount >= r.price ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pagado</span>
                    ) : r.paid_amount > 0 ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Parcial</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nulo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                      {HISTORY_STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}