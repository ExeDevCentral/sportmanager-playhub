import * as XLSX from "xlsx";

export type ImportPreview = {
  sheets: string[];
  activeSheet: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

export type ValidatedRow = {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
};

export type ImportMapping = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

const CAMPO_DESTINO: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  email: "Email",
  phone: "Teléfono",
};

export function parseWorkbook(buffer: ArrayBuffer): ImportPreview {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheets = wb.SheetNames;
  const activeSheet = sheets[0]!;
  const ws = wb.Sheets[activeSheet]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]!) : [];

  return { sheets, activeSheet, headers, rows };
}

/** Intenta adivinar el mapeo de columnas según el nombre del encabezado (en español). */
export function guessMapping(headers: string[]): ImportMapping {
  const norm = (h: string) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  return {
    firstName: headers.find((h) => /nombre|name|first|cliente/.test(norm(h))) ?? null,
    lastName: headers.find((h) => /apellido|last name|surname|lastname/.test(norm(h))) ?? null,
    email: headers.find((h) => /email|correo|mail|e-mail/.test(norm(h))) ?? null,
    phone: headers.find((h) => /tel|telefono|phone|celular|movil|whatsapp/.test(norm(h))) ?? null,
  };
}

export function validateRows(
  preview: ImportPreview,
  mapping: ImportMapping,
  existing: { email: string; phone: string }[],
): ValidatedRow[] {
  const existingEmails = new Set(existing.map((c) => (c.email ?? "").toLowerCase().trim()).filter(Boolean));
  const existingPhones = new Set(existing.map((c) => (c.phone ?? "").trim()).filter(Boolean));

  return preview.rows.map((raw, idx) => {
    const rowNumber = idx + 2; // +1 header
    const errors: string[] = [];

    const firstName = mapping.firstName ? String(raw[mapping.firstName] ?? "").trim() : "";
    const lastName = mapping.lastName ? String(raw[mapping.lastName] ?? "").trim() : "";
    const email = mapping.email ? String(raw[mapping.email] ?? "").trim() : "";
    const phone = mapping.phone ? String(raw[mapping.phone] ?? "").trim() : "";

    if (!firstName && !email && !phone) errors.push("Fila vacía");
    if (mapping.firstName && !firstName) errors.push("Nombre requerido");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Email inválido: ${email}`);
    if (phone && !/^[+0-9 ()-]{6,20}$/.test(phone)) errors.push(`Teléfono inválido: ${phone}`);

    const isDuplicate =
      Boolean(email && existingEmails.has(email.toLowerCase().trim())) ||
      Boolean(phone && existingPhones.has(phone));

    if (isDuplicate) errors.push("Ya existe un cliente con este email/teléfono");

    return {
      rowNumber,
      data: { firstName, lastName, email, phone },
      errors,
      isValid: errors.length === 0,
      isDuplicate,
    };
  });
}

export function exportToExcel(
  title: string,
  columns: { header: string; key: string }[],
  rows: Record<string, unknown>[],
): void {
  const data = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) out[col.header] = r[col.key] ?? "";
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function resultMessage(rows: ValidatedRow[]): string {
  const valid = rows.filter((r) => r.isValid).length;
  const invalid = rows.length - valid;
  return `${valid} filas válidas · ${invalid} filas con errores`;
}

export { CAMPO_DESTINO };