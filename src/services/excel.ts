import { isDemoMode } from "@/lib/demo";
import type { ImportJobStatus, ImportRowStatus } from "@/types/database";

export type ImportJobSummary = {
  id: string;
  file_name: string;
  sheet_name: string | null;
  entity_types: string[];
  status: ImportJobStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  skipped_rows: number;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

export const IMPORT_STATUS_LABEL: Record<ImportJobStatus, string> = {
  uploaded: "Subido",
  parsed: "Parseado",
  mapped: "Mapeado",
  validated: "Validado",
  importing: "Importando",
  completed: "Completado",
  failed: "Falló",
  cancelled: "Cancelado",
};

export const IMPORT_ROW_STATUS_LABEL: Record<ImportRowStatus, string> = {
  pending: "Pendiente",
  valid: "Válida",
  invalid: "Inválida",
  imported: "Importada",
  skipped: "Omitida",
};

function getDemoHistory(): ImportJobSummary[] {
  const today = new Date();
  const mk = (offsetDays: number, hour: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(hour, 15, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "job-3",
      file_name: "clientes_agosto.xlsx",
      sheet_name: "Clientes",
      entity_types: ["customers"],
      status: "completed",
      total_rows: 248,
      valid_rows: 236,
      invalid_rows: 12,
      imported_rows: 236,
      skipped_rows: 0,
      started_at: mk(2, 10),
      finished_at: mk(2, 10),
      created_at: mk(2, 9),
    },
    {
      id: "job-2",
      file_name: "reservas_historico_cancha2.csv",
      sheet_name: "Hoja1",
      entity_types: ["reservations"],
      status: "completed",
      total_rows: 512,
      valid_rows: 481,
      invalid_rows: 31,
      imported_rows: 481,
      skipped_rows: 0,
      started_at: mk(6, 16),
      finished_at: mk(6, 16),
      created_at: mk(6, 15),
    },
    {
      id: "job-1",
      file_name: "pagos_historial.xlsx",
      sheet_name: "Pagos",
      entity_types: ["payments"],
      status: "failed",
      total_rows: 89,
      valid_rows: 57,
      invalid_rows: 32,
      imported_rows: 0,
      skipped_rows: 0,
      started_at: mk(12, 11),
      finished_at: mk(12, 11),
      created_at: mk(12, 10),
    },
  ];
}

async function getDemoExistingCustomers(): Promise<{ email: string; phone: string }[]> {
  const { getCustomers } = await import("@/services/customers");
  const customers = await getCustomers();
  return customers.map((c) => ({ email: c.email ?? "", phone: c.phone ?? "" }));
}

export async function getImportHistory(): Promise<ImportJobSummary[]> {
  if (isDemoMode()) {
    return getDemoHistory();
  }
  // TODO(Fase 9 real): query import_jobs
  throw new Error("Supabase no implementado aún (Fase 9).");
}

export async function getExistingCustomers(): Promise<{ email: string; phone: string }[]> {
  if (isDemoMode()) {
    return getDemoExistingCustomers();
  }
  // TODO(Fase 9 real): query customers
  throw new Error("Supabase no implementado aún (Fase 9).");
}