"use client";

import * as React from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { reloadPayments } from "./actions";
import { PAYMENT_CONCEPT_LABEL, PAYMENT_PROVIDER_LABEL } from "@/services/labels";
import type { PaymentSummary } from "@/services/payments";
import type { PaymentStatus } from "@/types/database";

const STATUS_VARIANT: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  cancelled: "destructive",
  refunded: "outline",
  charged_back: "destructive",
};

export function PaymentsClient() {
  const [payments, setPayments] = React.useState<PaymentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PaymentStatus>("all");
  const [conceptFilter, setConceptFilter] = React.useState<"all" | "deposit" | "full" | "balance">("all");
  const [totals, setTotals] = React.useState<{ approved: number; pending: number; refunded: number; rejected: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    reloadPayments()
      .then((data) => {
        if (cancelled) return;
        setPayments(data.payments);
        setTotals(data.totals);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesQuery =
        !q ||
        (p.customer_name ?? "").toLowerCase().includes(q) ||
        (p.court_name ?? "").toLowerCase().includes(q) ||
        (p.provider_payment_id ?? "").includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesConcept = conceptFilter === "all" || p.concept === conceptFilter;
      return matchesQuery && matchesStatus && matchesConcept;
    });
  }, [payments, query, statusFilter, conceptFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pagos</h1>
          <p className="text-sm text-muted-foreground">Conciliación de pagos por Mercado Pago y manuales.</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Aprobado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {totals ? formatCurrency(totals.approved) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Pendiente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {totals ? formatCurrency(totals.pending) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reembolsado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {totals ? formatCurrency(totals.refunded) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rechazado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {totals ? formatCurrency(totals.rejected) : "—"}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por cliente, cancha o ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | PaymentStatus)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={conceptFilter} onValueChange={(v) => setConceptFilter(v as "all" | "deposit" | "full" | "balance")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Concepto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los conceptos</SelectItem>
            <SelectItem value="deposit">Seña</SelectItem>
            <SelectItem value="full">Pago total</SelectItem>
            <SelectItem value="balance">Saldo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setQuery(""); setStatusFilter("all"); setConceptFilter("all"); }}>
          Limpiar filtros
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cargando pagos…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cancha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron pagos.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{p.customer_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.court_name ?? "—"}</TableCell>
                    <TableCell>{PAYMENT_CONCEPT_LABEL[p.concept]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {PAYMENT_PROVIDER_LABEL[p.provider]}
                      {p.provider_payment_id && (
                        <span className="ml-1 text-[10px] text-muted-foreground/70">· {p.provider_payment_id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]}>
                        {p.status === "approved" ? "Aprobado"
                          : p.status === "pending" ? "Pendiente"
                          : p.status === "rejected" ? "Rechazado"
                          : p.status === "refunded" ? "Reembolsado"
                          : p.status === "cancelled" ? "Cancelado"
                          : "Contracargo"}
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
  );
}
