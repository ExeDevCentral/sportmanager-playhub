import type { DemoRole } from "@/lib/auth/demo-account";
import { DEMO_ROLE_SHORT } from "@/lib/auth/demo-account";
import { downloadCSV } from "@/lib/csv";

export type AuditCategory =
  | "cobro"
  | "devolucion"
  | "proveedor"
  | "reserva"
  | "cancha"
  | "cliente";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: DemoRole;
  category: AuditCategory;
  action: string;
  target: string;
  amount: number | null;
  detail: string;
};

const AUDIT_STORAGE_KEY = "sportmanager-demo-audit-log";

function getSeedAuditEvents(): AuditEvent[] {
  const now = Date.now();
  return [
    {
      id: "aud-seed-1",
      timestamp: new Date(now - 1000 * 60 * 42).toISOString(),
      actorName: "Pedro",
      actorRole: "operator",
      category: "cobro",
      action: "Cobro en efectivo",
      target: "Juan Pérez · Cancha 1",
      amount: 16000,
      detail: "Pago total · Efectivo recibido $20.000 · Vuelto $4.000",
    },
    {
      id: "aud-seed-2",
      timestamp: new Date(now - 1000 * 60 * 95).toISOString(),
      actorName: "Juan",
      actorRole: "owner",
      category: "proveedor",
      action: "Pago a proveedor",
      target: "Distribuidora PadelPro",
      amount: -68500,
      detail: "Insumos deportivos · Transferencia · Tubos de pelotas x24",
    },
    {
      id: "aud-seed-3",
      timestamp: new Date(now - 1000 * 60 * 140).toISOString(),
      actorName: "Pedro",
      actorRole: "operator",
      category: "reserva",
      action: "Check-in / Reserva",
      target: "María González · Cancha 2",
      amount: 8000,
      detail: "Seña registrada · Turno 19:00 hs",
    },
  ];
}

export function readAuditEvents(): AuditEvent[] {
  if (typeof window === "undefined") return getSeedAuditEvents();
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return getSeedAuditEvents();
    const parsed = JSON.parse(raw) as AuditEvent[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getSeedAuditEvents();
  } catch {
    return getSeedAuditEvents();
  }
}

export function recordAuditEvent(
  event: Omit<AuditEvent, "id" | "timestamp">,
): AuditEvent {
  const entry: AuditEvent = {
    ...event,
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = readAuditEvents();
      const next = [entry, ...current].slice(0, 250);
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return entry;
}

export function exportAuditCsv(events: AuditEvent[]): void {
  downloadCSV(
    `auditoria_turno_${new Date().toISOString().slice(0, 10)}.csv`,
    ["Fecha y Hora", "Responsable", "Rol", "Categoría", "Acción", "Objetivo", "Importe", "Detalle"],
    events.map((e) => [
      new Date(e.timestamp).toLocaleString("es-AR"),
      e.actorName,
      DEMO_ROLE_SHORT[e.actorRole],
      e.category,
      e.action,
      e.target,
      e.amount ?? "",
      e.detail,
    ]),
  );
}
