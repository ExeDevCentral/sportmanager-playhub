"use client";

import * as React from "react";
import {
  Users,
  Loader2,
  Search,
  Phone,
  Mail,
  CalendarDays,
  Wallet,
  Star,
  MapPin,
  MessageCircle,
  Plus,
  X,
  Download,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pencil,
  ArrowUpDown,
  TrendingUp,
  UserCheck,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { loadCustomers, loadCustomerHistory } from "./actions";
import type {
  CustomerStats,
  CustomerStatus,
  ReservationDetail,
  NotificationChannel,
} from "@/types/database";
import { toast } from "sonner";

const DEMO_STORAGE_KEY = "sportmanager-demo-customers";

type FilterTab = "all" | "active" | "vip" | "inactive" | "blocked" | "attention";
type SortOption = "spent_desc" | "reservations_desc" | "recent_desc" | "name_asc";

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
};

const STATUS_META: Record<
  CustomerStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Activo",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  inactive: {
    label: "Inactivo",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  blocked: {
    label: "Bloqueado",
    dotClass: "bg-destructive",
    badgeClass:
      "bg-destructive/12 text-destructive border-destructive/25",
  },
};

const RES_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  confirmed: {
    label: "Confirmada",
    badgeClass:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  completed: {
    label: "Completada",
    badgeClass:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
  },
  pending: {
    label: "Pendiente",
    badgeClass:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  cancelled: {
    label: "Cancelada",
    badgeClass:
      "bg-destructive/12 text-destructive border-destructive/25",
  },
  no_show: {
    label: "No vino",
    badgeClass:
      "bg-destructive/12 text-destructive border-destructive/25",
  },
};

const AVATAR_TONES = [
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
];

function initials(first: string, last: string | null): string {
  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}

function isVipCustomer(c: CustomerStats): boolean {
  return c.reservations_count >= 15 || c.total_spent >= 350_000;
}

function needsAttention(c: CustomerStats): boolean {
  return c.status !== "active" || c.no_shows_count >= 2;
}

function getLoyaltyTier(c: CustomerStats): {
  label: string;
  className: string;
  isVip: boolean;
} {
  if (isVipCustomer(c)) {
    return {
      label: "VIP",
      className:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      isVip: true,
    };
  }
  if (c.reservations_count >= 6) {
    return {
      label: "Frecuente",
      className:
        "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
      isVip: false,
    };
  }
  if (c.reservations_count === 0) {
    return {
      label: "Nuevo",
      className: "bg-muted text-muted-foreground border-border",
      isVip: false,
    };
  }
  return {
    label: "Regular",
    className: "bg-muted/70 text-foreground/80 border-border",
    isVip: false,
  };
}

function getAttendanceRate(c: CustomerStats): number | null {
  if (c.reservations_count <= 0) return null;
  const attended = Math.max(0, c.reservations_count - c.no_shows_count);
  return Math.round((attended / c.reservations_count) * 100);
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "Sin reservas";
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `Hace ${diffDays} días`;
  return formatDate(date);
}

function buildWhatsAppHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function ChannelIcon({ channel }: { channel: NotificationChannel | null }) {
  if (channel === "whatsapp") {
    return <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
  }
  return <Mail className="size-3.5 text-muted-foreground" />;
}

type CustomerFormState = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  preferred_contact_channel: NotificationChannel;
  status: CustomerStatus;
  notes: string;
};

const EMPTY_FORM: CustomerFormState = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  preferred_contact_channel: "whatsapp",
  status: "active",
  notes: "",
};

function readLocalOverrides(): CustomerStats[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomerStats[]) : [];
  } catch {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    return [];
  }
}

function writeLocalOverride(customer: CustomerStats) {
  if (typeof window === "undefined") return;
  try {
    const existing = readLocalOverrides();
    const updated = [
      customer,
      ...existing.filter((item) => item.customer_id !== customer.customer_id),
    ];
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
}

export function CustomersClient() {
  const [customers, setCustomers] = React.useState<CustomerStats[]>([]);
  const [historyState, setHistoryState] = React.useState<{
    customerId: string;
    items: ReservationDetail[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [query, setQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("spent_desc");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [dialogMode, setDialogMode] = React.useState<"create" | "edit" | null>(null);
  const [formState, setFormState] = React.useState<CustomerFormState>(EMPTY_FORM);

  React.useEffect(() => {
    let cancelled = false;
    loadCustomers()
      .then((data) => {
        if (cancelled) return;
        const localList = readLocalOverrides();
        const localMap = new Map(localList.map((c) => [c.customer_id, c]));
        const merged = [
          ...localList.filter((l) => !data.some((d) => d.customer_id === l.customer_id)),
          ...data.map((d) => localMap.get(d.customer_id) ?? d),
        ];
        setCustomers(merged);
        if (merged.length > 0) {
          const top = [...merged].sort((a, b) => b.total_spent - a.total_spent)[0];
          setSelectedId(top?.customer_id ?? merged[0]!.customer_id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = React.useMemo(
    () => customers.find((c) => c.customer_id === selectedId) ?? null,
    [customers, selectedId],
  );

  const needsHistory = Boolean(selected && selected.reservations_count > 0);
  const loadingHistory =
    needsHistory && historyState?.customerId !== selected?.customer_id;
  const history =
    needsHistory && historyState && historyState.customerId === selected?.customer_id
      ? historyState.items
      : [];

  React.useEffect(() => {
    if (!selected || selected.reservations_count === 0) return;

    const targetId = selected.customer_id;
    let cancelled = false;
    loadCustomerHistory(targetId)
      .then((data) => {
        if (!cancelled) setHistoryState({ customerId: targetId, items: data });
      })
      .catch(() => {
        if (!cancelled) setHistoryState({ customerId: targetId, items: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const counts = React.useMemo(() => {
    const active = customers.filter((c) => c.status === "active").length;
    const vip = customers.filter(isVipCustomer).length;
    const inactive = customers.filter((c) => c.status === "inactive").length;
    const blocked = customers.filter((c) => c.status === "blocked").length;
    const attention = customers.filter(needsAttention).length;
    const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgLtv = customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;
    const activePct = customers.length > 0 ? Math.round((active / customers.length) * 100) : 0;

    return {
      total: customers.length,
      active,
      vip,
      inactive,
      blocked,
      attention,
      totalSpent,
      avgLtv,
      activePct,
    };
  }, [customers]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchesTab = (c: CustomerStats) => {
      switch (activeTab) {
        case "active":
          return c.status === "active";
        case "vip":
          return isVipCustomer(c);
        case "inactive":
          return c.status === "inactive";
        case "blocked":
          return c.status === "blocked";
        case "attention":
          return needsAttention(c);
        default:
          return true;
      }
    };

    const list = customers.filter((c) => {
      if (!matchesTab(c)) return false;
      if (!q) return true;
      const fullName = `${c.first_name} ${c.last_name ?? ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.favorite_court_name ?? "").toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "spent_desc":
          return b.total_spent - a.total_spent;
        case "reservations_desc":
          return b.reservations_count - a.reservations_count;
        case "recent_desc":
          return (
            new Date(b.last_reservation_at ?? b.created_at).getTime() -
            new Date(a.last_reservation_at ?? a.created_at).getTime()
          );
        case "name_asc":
          return `${a.first_name} ${a.last_name ?? ""}`.localeCompare(
            `${b.first_name} ${b.last_name ?? ""}`,
            "es",
          );
      }
    });
  }, [customers, query, activeTab, sortBy]);

  const openCreateDialog = () => {
    setFormState(EMPTY_FORM);
    setDialogMode("create");
  };

  const openEditDialog = (customer: CustomerStats) => {
    setFormState({
      first_name: customer.first_name,
      last_name: customer.last_name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      preferred_contact_channel: customer.preferred_contact_channel ?? "whatsapp",
      status: customer.status,
      notes: customer.notes ?? "",
    });
    setDialogMode("edit");
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.first_name.trim()) {
      toast.error("Nombre requerido", {
        description: "Ingresá al menos el nombre del cliente.",
      });
      return;
    }

    if (dialogMode === "create") {
      const created: CustomerStats = {
        customer_id: `cust-${Date.now()}`,
        complex_id: "demo-complex-001",
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim() || null,
        phone: formState.phone.trim() || null,
        email: formState.email.trim() || null,
        birth_date: null,
        status: formState.status,
        notes: formState.notes.trim() || null,
        preferred_contact_channel: formState.preferred_contact_channel,
        created_at: new Date().toISOString(),
        reservations_count: 0,
        last_reservation_at: null,
        cancellations_count: 0,
        no_shows_count: 0,
        total_spent: 0,
        favorite_court_id: null,
        favorite_court_name: null,
        favorite_hour: null,
      };

      writeLocalOverride(created);
      setCustomers((prev) => [created, ...prev]);
      setSelectedId(created.customer_id);
      setActiveTab("all");
      setDialogMode(null);
      toast.success("Cliente creado", {
        description: `${created.first_name} ${created.last_name ?? ""} fue registrado.`,
      });
      return;
    }

    if (dialogMode === "edit" && selected) {
      const updated: CustomerStats = {
        ...selected,
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim() || null,
        phone: formState.phone.trim() || null,
        email: formState.email.trim() || null,
        preferred_contact_channel: formState.preferred_contact_channel,
        status: formState.status,
        notes: formState.notes.trim() || null,
      };

      writeLocalOverride(updated);
      setCustomers((prev) =>
        prev.map((c) => (c.customer_id === updated.customer_id ? updated : c)),
      );
      setDialogMode(null);
      toast.success("Ficha actualizada", {
        description: `Se guardaron los cambios de ${updated.first_name}.`,
      });
    }
  };

  const handleExport = () => {
    downloadCSV(
      "clientes.csv",
      [
        "Nombre",
        "Apellido",
        "Email",
        "Teléfono",
        "Estado",
        "Reservas",
        "Cancelaciones",
        "No-shows",
        "Gasto total",
        "Canal preferido",
      ],
      filtered.map((c) => [
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        STATUS_META[c.status].label,
        c.reservations_count,
        c.cancellations_count,
        c.no_shows_count,
        c.total_spent,
        c.preferred_contact_channel ? CHANNEL_LABEL[c.preferred_contact_channel] : "",
      ]),
    );
    toast.success("Exportación lista", {
      description: `Se descargaron ${filtered.length} clientes en CSV.`,
    });
  };

  const filterPills: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: counts.total },
    { key: "active", label: "Activos", count: counts.active },
    { key: "vip", label: "VIP", count: counts.vip },
    { key: "inactive", label: "Inactivos", count: counts.inactive },
    { key: "blocked", label: "Bloqueados", count: counts.blocked },
  ];

  const selectedTier = selected ? getLoyaltyTier(selected) : null;
  const selectedStatus = selected ? STATUS_META[selected.status] : null;
  const attendanceRate = selected ? getAttendanceRate(selected) : null;
  const avgTicket =
    selected && selected.reservations_count > 0
      ? Math.round(selected.total_spent / selected.reservations_count)
      : 0;
  const whatsappHref = selected ? buildWhatsAppHref(selected.phone) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground ring-1 ring-primary/30">
            <Users className="size-5 text-emerald-700 dark:text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground">
              Base de jugadores, métricas de fidelidad e historial de reservas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="gap-1.5"
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
          <Button size="sm" onClick={openCreateDialog} className="gap-1.5">
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Strip ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Total clientes"
          value={formatNumber(counts.total)}
          caption={`${counts.active} activos (${counts.activePct}%)`}
          icon={<UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />}
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <KpiTile
          label="Clientes VIP"
          value={formatNumber(counts.vip)}
          caption="15+ reservas o alto consumo"
          icon={<Crown className="size-4 text-amber-500" />}
          active={activeTab === "vip"}
          onClick={() => setActiveTab((prev) => (prev === "vip" ? "all" : "vip"))}
        />
        <KpiTile
          label="Cartera total (LTV)"
          value={formatCurrency(counts.totalSpent)}
          caption={`Ticket prom. ${formatCurrency(counts.avgLtv)}`}
          icon={<TrendingUp className="size-4 text-sky-600 dark:text-sky-400" />}
        />
        <KpiTile
          label="Requieren atención"
          value={formatNumber(counts.attention)}
          caption="Inactivos, bloqueados o no-shows"
          icon={
            <AlertTriangle
              className={`size-4 ${
                counts.attention > 0 ? "text-amber-500" : "text-muted-foreground"
              }`}
            />
          }
          active={activeTab === "attention"}
          onClick={() =>
            setActiveTab((prev) => (prev === "attention" ? "all" : "attention"))
          }
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Cargando cartera de clientes…
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
          {/* ── Directorio (Lista izquierda) ── */}
          <Card className="gap-3 py-4">
            <CardContent className="space-y-3 px-4">
              {/* Buscador correctamente encapsulado */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros rápidos + Orden */}
              <div className="flex flex-wrap items-center gap-1.5">
                {filterPills.map((pill) => {
                  const isActive = activeTab === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => setActiveTab(pill.key)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-foreground text-background"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`tabular-nums text-[11px] ${
                          isActive ? "opacity-80" : "opacity-60"
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-b pb-2.5 text-xs text-muted-foreground">
                <span>
                  {formatNumber(filtered.length)}{" "}
                  {filtered.length === 1 ? "resultado" : "resultados"}
                </span>
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="size-3" />
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortOption)}
                  >
                    <SelectTrigger className="h-7 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs font-medium text-foreground shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="spent_desc">Mayor gasto</SelectItem>
                      <SelectItem value="reservations_desc">Más reservas</SelectItem>
                      <SelectItem value="recent_desc">Más recientes</SelectItem>
                      <SelectItem value="name_asc">Nombre A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>

            {/* Lista scrolleable */}
            <CardContent className="max-h-[580px] space-y-1 overflow-y-auto px-2.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Users className="size-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Sin clientes que coincidan</p>
                  <p className="text-xs text-muted-foreground">
                    Probá con otro término o limpiá los filtros activos.
                  </p>
                  {(query || activeTab !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => {
                        setQuery("");
                        setActiveTab("all");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = selected?.customer_id === c.customer_id;
                  const vip = isVipCustomer(c);
                  const statusMeta = STATUS_META[c.status];
                  return (
                    <button
                      key={c.customer_id}
                      type="button"
                      onClick={() => setSelectedId(c.customer_id)}
                      className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                        isSelected
                          ? "bg-accent ring-1 ring-ring/60 shadow-xs"
                          : "hover:bg-muted/70"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-10">
                          <AvatarFallback
                            className={`text-xs font-semibold ${avatarTone(c.customer_id)}`}
                          >
                            {initials(c.first_name, c.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          title={statusMeta.label}
                          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card ${statusMeta.dotClass}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {c.first_name} {c.last_name}
                          </p>
                          {vip && (
                            <Crown
                              aria-label="Cliente VIP"
                              className="size-3.5 shrink-0 text-amber-500"
                            />
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.reservations_count}{" "}
                          {c.reservations_count === 1 ? "reserva" : "reservas"}
                          {c.favorite_court_name ? ` · ${c.favorite_court_name}` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(c.total_spent)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeDate(c.last_reservation_at)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* ── Ficha 360° (Detalle derecho) ── */}
          {!selected ? (
            <Card className="flex min-h-[420px] items-center justify-center p-8 text-center">
              <div className="max-w-xs space-y-2">
                <Users className="mx-auto size-10 text-muted-foreground/40" />
                <h2 className="text-base font-semibold">
                  Seleccioná un cliente
                </h2>
                <p className="text-sm text-muted-foreground">
                  Elegí un jugador de la lista para ver su perfil, métricas de asistencia e historial completo.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Ficha Hero */}
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <Avatar className="size-14">
                        <AvatarFallback
                          className={`text-base font-semibold ${avatarTone(selected.customer_id)}`}
                        >
                          {initials(selected.first_name, selected.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      {selectedStatus && (
                        <span
                          className={`absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-card ${selectedStatus.dotClass}`}
                        />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">
                          {selected.first_name} {selected.last_name}
                        </CardTitle>
                        {selectedStatus && (
                          <Badge
                            variant="outline"
                            className={selectedStatus.badgeClass}
                          >
                            {selectedStatus.label}
                          </Badge>
                        )}
                        {selectedTier && (
                          <Badge
                            variant="outline"
                            className={selectedTier.className}
                          >
                            {selectedTier.isVip && <Crown className="size-3" />}
                            {selectedTier.label}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {selected.email ? (
                          <a
                            href={`mailto:${selected.email}`}
                            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
                          >
                            <Mail className="size-3.5" />
                            {selected.email}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3.5" /> Sin email
                          </span>
                        )}
                        {selected.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5" />
                            {selected.phone}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5" /> Sin teléfono
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex flex-wrap items-center gap-2">
                    {whatsappHref ? (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="gap-1.5"
                      >
                        <MessageCircle className="size-3.5" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(selected)}
                      className="gap-1.5"
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Barra de confiabilidad / asistencia */}
                  {attendanceRate !== null && (
                    <div className="rounded-lg border bg-muted/25 px-3.5 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          Confiabilidad de asistencia
                        </span>
                        <span className="font-semibold tabular-nums">
                          {attendanceRate}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            attendanceRate >= 85
                              ? "bg-emerald-500"
                              : attendanceRate >= 65
                                ? "bg-amber-500"
                                : "bg-destructive"
                          }`}
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 4 Métricas del cliente */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat
                      label="Reservas"
                      value={formatNumber(selected.reservations_count)}
                      icon={<CalendarDays className="size-3.5 text-muted-foreground" />}
                    />
                    <Stat
                      label="Gasto total"
                      value={formatCurrency(selected.total_spent)}
                      icon={<Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                    />
                    <Stat
                      label="Ticket prom."
                      value={formatCurrency(avgTicket)}
                      icon={<TrendingUp className="size-3.5 text-sky-600 dark:text-sky-400" />}
                    />
                    <Stat
                      label="Incumplimientos"
                      value={`${selected.cancellations_count} cancel · ${selected.no_shows_count} aus.`}
                      compact
                      alert={selected.no_shows_count >= 2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preferencias & Notas */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">Preferencias y notas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                  <InfoRow
                    label="Cliente desde"
                    value={formatDate(selected.created_at)}
                    icon={<Clock className="size-3.5 text-muted-foreground" />}
                  />
                  <InfoRow
                    label="Última reserva"
                    value={
                      selected.last_reservation_at
                        ? `${formatDate(selected.last_reservation_at)} (${formatRelativeDate(selected.last_reservation_at)})`
                        : "Sin reservas"
                    }
                    icon={<CalendarDays className="size-3.5 text-muted-foreground" />}
                  />
                  <InfoRow
                    label="Cancha favorita"
                    value={selected.favorite_court_name ?? "Sin definir"}
                    icon={<MapPin className="size-3.5 text-muted-foreground" />}
                  />
                  <InfoRow
                    label="Horario favorito"
                    value={
                      selected.favorite_hour != null
                        ? `${String(selected.favorite_hour).padStart(2, "0")}:00 hs`
                        : "Sin definir"
                    }
                    icon={<Star className="size-3.5 text-amber-500" />}
                  />
                  <InfoRow
                    label="Canal preferido"
                    value={
                      selected.preferred_contact_channel
                        ? CHANNEL_LABEL[selected.preferred_contact_channel]
                        : "—"
                    }
                    icon={<ChannelIcon channel={selected.preferred_contact_channel} />}
                  />
                  <InfoRow
                    label="No-shows registrados"
                    value={formatNumber(selected.no_shows_count)}
                    icon={
                      <AlertTriangle
                        className={`size-3.5 ${
                          selected.no_shows_count > 0
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    }
                  />

                  <div className="sm:col-span-2">
                    {selected.notes ? (
                      <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-xs text-foreground/90">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <p className="leading-relaxed">{selected.notes}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditDialog(selected)}
                          className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Editar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditDialog(selected)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                        Agregar nota sobre este jugador
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Reservas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Historial de reservas</CardTitle>
                  {history.length > 0 && (
                    <Badge variant="secondary" className="tabular-nums">
                      {history.length}{" "}
                      {history.length === 1 ? "movimiento" : "movimientos"}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loadingHistory ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" /> Cargando historial…
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
                      <CalendarDays className="size-7 text-muted-foreground/40" />
                      <p className="text-sm font-medium">Sin reservas registradas</p>
                      <p className="text-xs text-muted-foreground">
                        Cuando este jugador realice una reserva aparecerá aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">Fecha y hora</TableHead>
                            <TableHead>Cancha</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead className="pr-4 text-right">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((h) => {
                            const resMeta = RES_STATUS_META[h.status] ?? {
                              label: h.status,
                              badgeClass: "bg-muted text-foreground border-border",
                            };
                            const start = new Date(h.starts_at);
                            const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(
                              start.getMinutes(),
                            ).padStart(2, "0")}`;
                            return (
                              <TableRow key={h.id}>
                                <TableCell className="whitespace-nowrap pl-4 text-xs">
                                  <span className="font-medium text-foreground">
                                    {formatDate(start)}
                                  </span>
                                  <span className="ml-1.5 text-muted-foreground">
                                    {timeLabel} hs
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {h.court_name}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  <div className="text-sm font-medium">
                                    {formatCurrency(h.price)}
                                  </div>
                                  {h.paid_amount > 0 && h.paid_amount < h.price && (
                                    <div className="text-[11px] text-muted-foreground">
                                      Seña: {formatCurrency(h.paid_amount)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="pr-4 text-right">
                                  <Badge variant="outline" className={resMeta.badgeClass}>
                                    {resMeta.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Crear / Editar Cliente ── */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Actualizá los datos de contacto, estado o notas del jugador."
                : "Completá los datos para registrar un nuevo jugador en la base."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust_first_name">Nombre *</Label>
                <Input
                  id="cust_first_name"
                  placeholder="Ej: Lucas"
                  value={formState.first_name}
                  onChange={(e) =>
                    setFormState((f) => ({ ...f, first_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust_last_name">Apellido</Label>
                <Input
                  id="cust_last_name"
                  placeholder="Ej: Silva"
                  value={formState.last_name}
                  onChange={(e) =>
                    setFormState((f) => ({ ...f, last_name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_phone">Teléfono / WhatsApp</Label>
              <Input
                id="cust_phone"
                type="tel"
                placeholder="+54 9 11 4000-0000"
                value={formState.phone}
                onChange={(e) =>
                  setFormState((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_email">Correo electrónico</Label>
              <Input
                id="cust_email"
                type="email"
                placeholder="cliente@email.com"
                value={formState.email}
                onChange={(e) =>
                  setFormState((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Canal preferido</Label>
                <Select
                  value={formState.preferred_contact_channel}
                  onValueChange={(val: NotificationChannel) =>
                    setFormState((f) => ({ ...f, preferred_contact_channel: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={formState.status}
                  onValueChange={(val: CustomerStatus) =>
                    setFormState((f) => ({ ...f, status: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_notes">Notas del complejo</Label>
              <Textarea
                id="cust_notes"
                rows={3}
                placeholder="Nivel 4ta categoría, zurdo, prefiere cancha techada…"
                value={formState.notes}
                onChange={(e) =>
                  setFormState((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogMode(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {dialogMode === "edit" ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({
  label,
  value,
  caption,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <Card
      onClick={onClick}
      className={`py-0 transition-all ${
        interactive ? "cursor-pointer hover:ring-foreground/25" : ""
      } ${active ? "ring-2 ring-ring" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {caption && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon,
  compact,
  alert,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  compact?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        alert ? "border-amber-500/30 bg-amber-500/5" : "bg-muted/20"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={`mt-1 font-semibold tabular-nums ${
          compact ? "text-sm" : "text-lg"
        } ${alert ? "text-amber-700 dark:text-amber-300" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-none last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-right font-medium">
        {icon}
        <span>{value}</span>
      </span>
    </div>
  );
}
