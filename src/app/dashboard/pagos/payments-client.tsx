"use client";

import * as React from "react";
import {
  Banknote,
  Building2,
  Calculator,
  ClipboardCheck,
  CreditCard,
  Download,
  Loader2,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { reloadPayments } from "./actions";
import { PAYMENT_CONCEPT_LABEL, PAYMENT_PROVIDER_LABEL } from "@/services/labels";
import type { PaymentSummary } from "@/services/payments";
import { DEMO_ROLE_SHORT, type DemoRole } from "@/lib/auth/demo-account";
import type { PaymentConcept, PaymentStatus } from "@/types/database";
import {
  exportAuditCsv,
  readAuditEvents,
  recordAuditEvent,
  type AuditEvent,
} from "@/lib/audit";
import { toast } from "sonner";

const CASH_STORAGE_KEY = "sportmanager-demo-cash-payments";
const REFUND_STORAGE_KEY = "sportmanager-demo-refunded-payments";
const SUPPLIER_STORAGE_KEY = "sportmanager-demo-supplier-payments";

type SupplierCategory = "servicios" | "mantenimiento" | "insumos" | "personal" | "otros";
type SupplierMethod = "efectivo" | "transferencia" | "mercadopago";

type SupplierPayment = {
  id: string;
  supplier: string;
  category: SupplierCategory;
  method: SupplierMethod;
  amount: number;
  note: string;
  created_at: string;
};

const CATEGORY_LABEL: Record<SupplierCategory, string> = {
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  insumos: "Insumos deportivos",
  personal: "Personal / Profes",
  otros: "Otros",
};

const METHOD_LABEL: Record<SupplierMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
};

const INITIAL_SUPPLIERS: SupplierPayment[] = [
  {
    id: "sup-1",
    supplier: "Distribuidora PadelPro",
    category: "insumos",
    method: "transferencia",
    amount: 68500,
    note: "Tubos de pelotas x24 y grips",
    created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
  },
  {
    id: "sup-2",
    supplier: "Edenor / Servicio Eléctrico",
    category: "servicios",
    method: "mercadopago",
    amount: 94200,
    note: "Iluminación LED canchas 1 a 4",
    created_at: new Date(Date.now() - 86_400_000 * 5).toISOString(),
  },
  {
    id: "sup-3",
    supplier: "Césped & Blindex Sur",
    category: "mantenimiento",
    method: "efectivo",
    amount: 45000,
    note: "Cepillado y arena Cancha 2",
    created_at: new Date(Date.now() - 86_400_000 * 8).toISOString(),
  },
];

const STATUS_VARIANT: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  cancelled: "destructive",
  refunded: "outline",
  charged_back: "destructive",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function PaymentsClient({
  role = "owner",
  actorName = "Juan",
}: {
  role?: DemoRole;
  actorName?: string;
}) {
  const isOwner = role === "owner" || role === "platform";

  const [payments, setPayments] = React.useState<PaymentSummary[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierPayment[]>(INITIAL_SUPPLIERS);
  const [auditEvents, setAuditEvents] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PaymentStatus>("all");
  const [conceptFilter, setConceptFilter] = React.useState<"all" | "deposit" | "full" | "balance">("all");

  // Modal: Cobro en efectivo + vuelto (Empleado y Dueño)
  const [cashOpen, setCashOpen] = React.useState(false);
  const [cashForm, setCashForm] = React.useState({
    customer: "",
    court: "Cancha 1",
    concept: "full" as PaymentConcept,
    amount: "16000",
    received: "20000",
  });

  // Modal: Devolución / Reembolso (Solo Dueño/Admin)
  const [refundTarget, setRefundTarget] = React.useState<PaymentSummary | null>(null);
  const [refundReason, setRefundReason] = React.useState("Lluvia / cancha suspendida");

  // Modal: Pago a proveedores (Solo Dueño/Admin)
  const [supplierOpen, setSupplierOpen] = React.useState(false);
  const [supplierForm, setSupplierForm] = React.useState({
    supplier: "",
    category: "insumos" as SupplierCategory,
    method: "efectivo" as SupplierMethod,
    amount: "",
    note: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    reloadPayments()
      .then((data) => {
        if (cancelled) return;
        const localCash = readStorage<PaymentSummary[]>(CASH_STORAGE_KEY, []);
        const refundedIds = new Set(readStorage<string[]>(REFUND_STORAGE_KEY, []));
        const merged = [...localCash, ...data.payments].map((p) =>
          refundedIds.has(p.id) ? { ...p, status: "refunded" as PaymentStatus } : p,
        );
        setPayments(merged);
        const localSuppliers = readStorage<SupplierPayment[] | null>(SUPPLIER_STORAGE_KEY, null);
        if (localSuppliers) setSuppliers(localSuppliers);
        setAuditEvents(readAuditEvents());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = React.useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        if (p.status === "approved") acc.approved += p.amount;
        else if (p.status === "pending") acc.pending += p.amount;
        else if (p.status === "refunded") acc.refunded += p.amount;
        else if (p.status === "rejected" || p.status === "charged_back") acc.rejected += p.amount;
        return acc;
      },
      { approved: 0, pending: 0, refunded: 0, rejected: 0 },
    );
  }, [payments]);

  const totalSuppliers = React.useMemo(
    () => suppliers.reduce((sum, s) => sum + s.amount, 0),
    [suppliers],
  );

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

  const cashAmount = Number(cashForm.amount) || 0;
  const cashReceived = Number(cashForm.received) || 0;
  const cashChange = cashReceived - cashAmount;
  const isCashValid = cashForm.customer.trim().length > 0 && cashAmount > 0 && cashReceived >= cashAmount;

  const handleConfirmCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCashValid) return;

    const newPayment: PaymentSummary = {
      id: `cash-${Date.now()}`,
      reservation_id: null,
      customer_name: cashForm.customer.trim(),
      court_name: cashForm.court,
      concept: cashForm.concept,
      amount: cashAmount,
      currency: "ARS",
      status: "approved",
      provider: "manual",
      provider_payment_id: cashChange > 0 ? `Vuelto ${formatCurrency(cashChange)}` : "Efectivo exacto",
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const currentLocal = readStorage<PaymentSummary[]>(CASH_STORAGE_KEY, []);
    writeStorage(CASH_STORAGE_KEY, [newPayment, ...currentLocal]);
    setPayments((prev) => [newPayment, ...prev]);

    const logged = recordAuditEvent({
      actorName,
      actorRole: role,
      category: "cobro",
      action: "Cobro en efectivo",
      target: `${newPayment.customer_name} · ${newPayment.court_name}`,
      amount: cashAmount,
      detail: `${PAYMENT_CONCEPT_LABEL[cashForm.concept]} · Recibido ${formatCurrency(cashReceived)}${cashChange > 0 ? ` · Vuelto ${formatCurrency(cashChange)}` : " · Exacto"}`,
    });
    setAuditEvents((prev) => [logged, ...prev]);
    setCashOpen(false);
    setCashForm({
      customer: "",
      court: "Cancha 1",
      concept: "full",
      amount: "16000",
      received: "20000",
    });
    toast.success("Pago en efectivo registrado", {
      description:
        cashChange > 0
          ? `Cobrado ${formatCurrency(cashAmount)} · Vuelto: ${formatCurrency(cashChange)}`
          : `Cobrado ${formatCurrency(cashAmount)} (exacto)`,
    });
  };

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget || !isOwner) return;

    const refundedIds = readStorage<string[]>(REFUND_STORAGE_KEY, []);
    if (!refundedIds.includes(refundTarget.id)) {
      writeStorage(REFUND_STORAGE_KEY, [refundTarget.id, ...refundedIds]);
    }

    setPayments((prev) =>
      prev.map((p) =>
        p.id === refundTarget.id
          ? {
              ...p,
              status: "refunded",
              provider_payment_id: refundReason.trim() || "Devolución",
            }
          : p,
      ),
    );
    toast.success("Devolución procesada", {
      description: `Se reembolsaron ${formatCurrency(refundTarget.amount)} a ${refundTarget.customer_name ?? "cliente"}.`,
    });
    const logged = recordAuditEvent({
      actorName,
      actorRole: role,
      category: "devolucion",
      action: "Devolución / Reembolso",
      target: `${refundTarget.customer_name ?? "Cliente"} · ${refundTarget.court_name ?? "—"}`,
      amount: -refundTarget.amount,
      detail: refundReason.trim() || "Devolución autorizada",
    });
    setAuditEvents((prev) => [logged, ...prev]);
    setRefundTarget(null);
  };

  const handleCreateSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const amount = Number(supplierForm.amount);
    if (!supplierForm.supplier.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Completá proveedor y monto válido");
      return;
    }

    const item: SupplierPayment = {
      id: `sup-${Date.now()}`,
      supplier: supplierForm.supplier.trim(),
      category: supplierForm.category,
      method: supplierForm.method,
      amount,
      note: supplierForm.note.trim() || "Pago a proveedor",
      created_at: new Date().toISOString(),
    };

    const next = [item, ...suppliers];
    setSuppliers(next);
    writeStorage(SUPPLIER_STORAGE_KEY, next);
    const logged = recordAuditEvent({
      actorName,
      actorRole: role,
      category: "proveedor",
      action: "Pago a proveedor",
      target: item.supplier,
      amount: -item.amount,
      detail: `${CATEGORY_LABEL[item.category]} · ${METHOD_LABEL[item.method]} · ${item.note}`,
    });
    setAuditEvents((prev) => [logged, ...prev]);
    setSupplierOpen(false);
    setSupplierForm({
      supplier: "",
      category: "insumos",
      method: "efectivo",
      amount: "",
      note: "",
    });
    toast.success("Pago a proveedor registrado", {
      description: `${item.supplier} · ${formatCurrency(item.amount)}`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pagos y Caja</h1>
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? "Cobros en efectivo, conciliación Mercado Pago, devoluciones y pago a proveedores."
                : "Cobros en efectivo con cálculo de vuelto y control de señas del turno."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setCashOpen(true)} className="gap-1.5">
            <Banknote className="size-4" />
            Cobrar en efectivo
          </Button>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSupplierOpen(true)}
              className="gap-1.5"
            >
              <Building2 className="size-4" />
              Pago a proveedor
            </Button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className={`grid gap-3 sm:grid-cols-2 ${isOwner ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <Card className="py-0">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Aprobado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-2xl font-semibold tabular-nums">
            {formatCurrency(totals.approved)}
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-2xl font-semibold tabular-nums">
            {formatCurrency(totals.pending)}
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Devoluciones
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-2xl font-semibold tabular-nums">
            {formatCurrency(totals.refunded)}
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="px-4 pt-4 pb-1">
            <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">
              Rechazado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-2xl font-semibold tabular-nums">
            {formatCurrency(totals.rejected)}
          </CardContent>
        </Card>
        {isOwner && (
          <Card className="py-0">
            <CardHeader className="px-4 pt-4 pb-1">
              <CardTitle className="text-xs font-medium text-sky-600 dark:text-sky-400">
                Proveedores (egresos)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {formatCurrency(totalSuppliers)}
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="cobros">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="cobros">
              {isOwner ? "Cobros y devoluciones" : "Cobros del club"}
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="proveedores">
                Proveedores ({suppliers.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="auditoria" className="gap-1.5">
              <ClipboardCheck className="size-3.5" />
              Auditoría del turno ({auditEvents.length})
            </TabsTrigger>
          </TabsList>

          {!isOwner && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert className="size-3.5" />
              Devoluciones y pagos a proveedores habilitados solo para Dueño / Admin
            </span>
          )}
        </div>

        {/* ── TAB COBROS ── */}
        <TabsContent value="cobros" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por cliente, cancha o detalle…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | PaymentStatus)}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Concepto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los conceptos</SelectItem>
                <SelectItem value="deposit">Seña</SelectItem>
                <SelectItem value="full">Pago total</SelectItem>
                <SelectItem value="balance">Saldo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setConceptFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
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
                      {isOwner && <TableHead className="text-right">Acción</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isOwner ? 8 : 7} className="h-24 text-center text-muted-foreground">
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
                            <span className="ml-1 text-[11px] text-muted-foreground/80">
                              · {p.provider_payment_id}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[p.status]}>
                            {p.status === "approved"
                              ? "Aprobado"
                              : p.status === "pending"
                                ? "Pendiente"
                                : p.status === "rejected"
                                  ? "Rechazado"
                                  : p.status === "refunded"
                                    ? "Reembolsado"
                                    : p.status === "cancelled"
                                      ? "Cancelado"
                                      : "Contracargo"}
                          </Badge>
                        </TableCell>
                        {isOwner && (
                          <TableCell className="text-right">
                            {p.status === "approved" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setRefundTarget(p);
                                  setRefundReason("Lluvia / cancha suspendida");
                                }}
                              >
                                <RotateCcw className="size-3" />
                                Devolver
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB PROVEEDORES (Solo Dueño / Admin) ── */}
        {isOwner && (
          <TabsContent value="proveedores" className="mt-4 space-y-4">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Medio</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(s.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{s.supplier}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{CATEGORY_LABEL[s.category]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {METHOD_LABEL[s.method]}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.note}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-destructive">
                          -{formatCurrency(s.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── TAB AUDITORÍA CONTABLE Y DE TURNO ── */}
        <TabsContent value="auditoria" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>
                Turno activo:{" "}
                <strong className="font-semibold text-foreground">
                  {actorName} ({DEMO_ROLE_SHORT[role]})
                </strong>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                Movimientos registrados:{" "}
                <strong className="font-medium text-foreground tabular-nums">
                  {auditEvents.length}
                </strong>
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => exportAuditCsv(auditEvents)}
            >
              <Download className="size-3.5" />
              Exportar auditoría CSV
            </Button>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Cliente / Concepto</TableHead>
                    <TableHead>Detalle contable</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((ev) => {
                    const dt = new Date(ev.timestamp);
                    const timeStr = `${String(dt.getHours()).padStart(2, "0")}:${String(
                      dt.getMinutes(),
                    ).padStart(2, "0")}`;
                    return (
                      <TableRow key={ev.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                          {formatDate(dt)} · {timeStr} hs
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium text-foreground">{ev.actorName}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({DEMO_ROLE_SHORT[ev.actorRole]})
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs font-medium">
                          {ev.action}
                        </TableCell>
                        <TableCell className="text-sm">{ev.target}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {ev.detail}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            ev.amount === null
                              ? "text-muted-foreground"
                              : ev.amount >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                          }`}
                        >
                          {ev.amount === null
                            ? "—"
                            : ev.amount >= 0
                              ? `+${formatCurrency(ev.amount)}`
                              : `-${formatCurrency(Math.abs(ev.amount))}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── MODAL COBRO EN EFECTIVO Y VUELTO ── */}
      <Dialog open={cashOpen} onOpenChange={setCashOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="size-4 text-emerald-600 dark:text-emerald-400" />
              Cobrar en efectivo
            </DialogTitle>
            <DialogDescription>
              Registrá el cobro en caja y calculá el vuelto al instante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCash} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cash_customer">Cliente / Jugador *</Label>
              <Input
                id="cash_customer"
                placeholder="Ej: Juan Pérez"
                value={cashForm.customer}
                onChange={(e) => setCashForm((f) => ({ ...f, customer: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cancha</Label>
                <Select
                  value={cashForm.court}
                  onValueChange={(v) => setCashForm((f) => ({ ...f, court: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cancha 1">Cancha 1</SelectItem>
                    <SelectItem value="Cancha 2">Cancha 2</SelectItem>
                    <SelectItem value="Cancha 3">Cancha 3</SelectItem>
                    <SelectItem value="Cancha 4">Cancha 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Concepto</Label>
                <Select
                  value={cashForm.concept}
                  onValueChange={(v) => setCashForm((f) => ({ ...f, concept: v as PaymentConcept }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Pago total</SelectItem>
                    <SelectItem value="deposit">Seña</SelectItem>
                    <SelectItem value="balance">Saldo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cash_amount">Importe a cobrar ($)</Label>
                <Input
                  id="cash_amount"
                  type="number"
                  min={1}
                  value={cashForm.amount}
                  onChange={(e) => setCashForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cash_received">Paga con ($)</Label>
                <Input
                  id="cash_received"
                  type="number"
                  min={0}
                  value={cashForm.received}
                  onChange={(e) => setCashForm((f) => ({ ...f, received: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCashForm((f) => ({ ...f, received: f.amount }))}
              >
                Exacto
              </Button>
              {[10000, 20000, 30000, 50000].map((bill) => (
                <Button
                  key={bill}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs tabular-nums"
                  onClick={() => setCashForm((f) => ({ ...f, received: String(bill) }))}
                >
                  {formatCurrency(bill)}
                </Button>
              ))}
            </div>

            <div
              className={`rounded-lg border p-3.5 text-center ${
                cashAmount <= 0
                  ? "bg-muted/30"
                  : cashChange >= 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <p className="text-xs font-medium opacity-80">
                {cashChange >= 0 ? "Vuelto a entregar" : "Falta abonar"}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">
                {formatCurrency(Math.abs(cashChange))}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCashOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isCashValid}>
                Confirmar cobro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL DEVOLUCIÓN (Solo Dueño / Admin) ── */}
      <Dialog open={refundTarget !== null} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4 text-destructive" />
              Procesar devolución
            </DialogTitle>
            <DialogDescription>
              {refundTarget
                ? `Reembolsar ${formatCurrency(refundTarget.amount)} a ${refundTarget.customer_name ?? "cliente"} (${refundTarget.court_name ?? "—"}).`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRefund} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="refund_reason">Motivo de la devolución</Label>
              <Input
                id="refund_reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ej: Lluvia, cancelación con aviso…"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRefundTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive">
                Confirmar devolución
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL PAGO A PROVEEDORES (Solo Dueño / Admin) ── */}
      <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-sky-600 dark:text-sky-400" />
              Registrar pago a proveedor
            </DialogTitle>
            <DialogDescription>
              Asentá egresos de mantenimiento, servicios, insumos o personal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSupplierPayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup_name">Proveedor *</Label>
              <Input
                id="sup_name"
                placeholder="Ej: Distribuidora PadelPro"
                value={supplierForm.supplier}
                onChange={(e) => setSupplierForm((f) => ({ ...f, supplier: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={supplierForm.category}
                  onValueChange={(v) =>
                    setSupplierForm((f) => ({ ...f, category: v as SupplierCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="insumos">Insumos deportivos</SelectItem>
                    <SelectItem value="personal">Personal / Profes</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Medio de pago</Label>
                <Select
                  value={supplierForm.method}
                  onValueChange={(v) =>
                    setSupplierForm((f) => ({ ...f, method: v as SupplierMethod }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup_amount">Monto ($) *</Label>
              <Input
                id="sup_amount"
                type="number"
                min={1}
                placeholder="45000"
                value={supplierForm.amount}
                onChange={(e) => setSupplierForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup_note">Comprobante / Detalle</Label>
              <Input
                id="sup_note"
                placeholder="Factura A-0012 · Tubos de pelotas"
                value={supplierForm.note}
                onChange={(e) => setSupplierForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSupplierOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar egreso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
