"use client";

import * as React from "react";
import { Users, Loader2, Search, Phone, Mail, CalendarDays, Wallet, Star, MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { loadCustomers, loadCustomerHistory } from "./actions";
import type { CustomerStats, ReservationDetail, NotificationChannel } from "@/types/database";
import { toast } from "sonner";

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
};

function ChannelIcon({ channel }: { channel: NotificationChannel | null }) {
  if (channel === "whatsapp") return <MessageCircle className="size-3.5 text-green-500" />;
  return <Mail className="size-3.5 text-muted-foreground" />;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Activo", variant: "default" },
  inactive: { label: "Inactivo", variant: "secondary" },
  blocked: { label: "Bloqueado", variant: "destructive" },
};

const RES_STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmada",
  completed: "Completada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  no_show: "No vino",
};

function initials(first: string, last: string | null): string {
  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function CustomersClient() {
  const [customers, setCustomers] = React.useState<CustomerStats[]>([]);
  const [history, setHistory] = React.useState<ReservationDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<CustomerStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setSelected(data[0] ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    const customerId = selected?.customer_id;
    if (!customerId) return;
    let cancelled = false;
    loadCustomerHistory(customerId)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => { cancelled = true; };
  }, [selected?.customer_id]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        `${c.first_name} ${c.last_name ?? ""}`.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0);
  const activeCount = customers.filter((c) => c.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {formatNumber(customers.length)} clientes · {formatNumber(activeCount)} activos
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          Cartera: {formatCurrency(totalSpent)}
        </Badge>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(
                "clientes.csv",
                ["Nombre", "Apellido", "Email", "Teléfono", "Estado", "Reservas", "Gasto total"],
                customers.map((c) => [
                  c.first_name,
                  c.last_name,
                  c.email,
                  c.phone,
                  c.status,
                  c.reservations_count,
                  c.total_spent,
                ]),
              )
            }
          >
            Exportar a Excel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              toast.info("Nuevo cliente", {
                description: "La alta de clientes se realiza desde reservas o importación en modo demo.",
              })
            }
          >
            Nuevo cliente
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Cargando clientes…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* ── Lista ── */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-3 pl-9"
            />
            <Card>
              <CardContent className="max-h-[640px] space-y-1 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
                )}
                {filtered.map((c) => {
                  const isSelected = selected?.customer_id === c.customer_id;
                  const badge = STATUS_BADGE[c.status]!;
                  return (
                    <button
                      key={c.customer_id}
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted ${
                        isSelected ? "bg-muted ring-1 ring-ring" : ""
                      }`}
                    >
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs">{initials(c.first_name, c.last_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.first_name} {c.last_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.email ?? "—"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums">{formatCurrency(c.total_spent)}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* ── Detalle ── */}
          {selected && (
            <div className="space-y-4">
              {/* Ficha */}
              <Card>
                <CardHeader className="flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback>{initials(selected.first_name, selected.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selected.first_name} {selected.last_name}</CardTitle>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="size-3" /> {selected.email ?? "—"}</span>
                        <span className="flex items-center gap-1"><Phone className="size-3" /> {selected.phone ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={STATUS_BADGE[selected.status]!.variant}>{STATUS_BADGE[selected.status]!.label}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Reservas" value={formatNumber(selected.reservations_count)} icon={<CalendarDays className="size-4 text-muted-foreground" />} />
                  <Stat label="Gasto total" value={formatCurrency(selected.total_spent)} icon={<Wallet className="size-4 text-blue-500" />} />
                  <Stat label="Canceladas" value={formatNumber(selected.cancellations_count)} muted />
                  <Stat label="No vino" value={formatNumber(selected.no_shows_count)} muted />
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Datos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <InfoRow label="Cliente desde" value={formatDate(selected.created_at)} />
                  <InfoRow label="Última reserva" value={selected.last_reservation_at ? formatDate(selected.last_reservation_at) : "Sin reservas"} />
                  <InfoRow
                    label="Cancha favorita"
                    value={selected.favorite_court_name ?? "—"}
                    icon={<MapPin className="size-3.5 text-muted-foreground" />}
                  />
                  <InfoRow
                    label="Horario favorito"
                    value={selected.favorite_hour != null ? `${String(selected.favorite_hour).padStart(2, "0")}:00` : "—"}
                    icon={<Star className="size-3.5 text-amber-500" />}
                  />
                  <InfoRow
                    label="Canal preferido"
                    value={selected.preferred_contact_channel ? CHANNEL_LABEL[selected.preferred_contact_channel] : "—"}
                    icon={<ChannelIcon channel={selected.preferred_contact_channel} />}
                  />
                  {selected.notes && (
                    <p className="col-span-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                      {selected.notes}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Historial */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Historial de reservas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingHistory ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" /> Cargando…
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cancha</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(h.starts_at)}
                              <span className="ml-1">
                                {new Date(h.starts_at).getHours().toString().padStart(2, "0")}:
                                {new Date(h.starts_at).getMinutes().toString().padStart(2, "0")}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{h.court_name}</TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">{formatCurrency(h.price)}</TableCell>
                            <TableCell>
                              <Badge variant={h.status === "cancelled" ? "destructive" : h.status === "pending" ? "secondary" : h.status === "completed" ? "outline" : "default"}>
                                {RES_STATUS_LABEL[h.status] ?? h.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, muted }: { label: string; value: string; icon?: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${muted ? "bg-muted/30" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-medium">{icon} {value}</span>
    </div>
  );
}