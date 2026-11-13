import * as XLSX from "xlsx";

export type ImportPreview = {
  sheets: string[];
  activeSheet: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

export type ValidatedRow = {
  rowNumber: number;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
  };
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
};

export type ImportMapping = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const CAMPO_DESTINO: Record<keyof ImportMapping, string> = {
  firstName: "Nombre *",
  lastName: "Apellido",
  email: "Email",
  phone: "Teléfono / WhatsApp",
  notes: "Notas",
};

function isRowEmpty(row: Record<string, unknown>): boolean {
  return Object.values(row).every((v) => String(v ?? "").trim() === "");
}

export function parseWorkbook(buffer: ArrayBuffer, preferredSheet?: string): ImportPreview {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheets = wb.SheetNames;
  if (sheets.length === 0) {
    throw new Error("El archivo no contiene hojas.");
  }
  const activeSheet =
    preferredSheet && sheets.includes(preferredSheet) ? preferredSheet : sheets[0]!;
  const ws = wb.Sheets[activeSheet]!;
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  const rows = rawRows.filter((r) => !isRowEmpty(r));
  const headers =
    rows.length > 0
      ? Object.keys(rows[0]!)
      : rawRows.length > 0
        ? Object.keys(rawRows[0]!)
        : [];

  return { sheets, activeSheet, headers, rows };
}

/** Intenta adivinar el mapeo de columnas según el nombre del encabezado (español/inglés). */
export function guessMapping(headers: string[]): ImportMapping {
  const norm = (h: string) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const firstName =
    headers.find((h) => /^(nombre|first_?name|first|cliente|jugador)$/.test(norm(h))) ??
    headers.find((h) => /nombre|name|first|cliente/.test(norm(h))) ??
    null;

  const lastName =
    headers.find(
      (h) => h !== firstName && /apellido|last_?name|surname/.test(norm(h)),
    ) ?? null;

  const email =
    headers.find((h) => /email|correo|mail|e-mail/.test(norm(h))) ?? null;

  const phone =
    headers.find((h) => /tel|telefono|phone|celular|movil|whatsapp|wsp/.test(norm(h))) ??
    null;

  const notes =
    headers.find((h) => /nota|obs|observacion|comentario/.test(norm(h))) ?? null;

  return { firstName, lastName, email, phone, notes };
}

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function validateRows(
  preview: ImportPreview,
  mapping: ImportMapping,
  existing: { email: string; phone: string }[],
): ValidatedRow[] {
  const existingEmails = new Set(
    existing.map((c) => (c.email ?? "").toLowerCase().trim()).filter(Boolean),
  );
  const existingPhones = new Set(
    existing.map((c) => (c.phone ?? "").replace(/\D/g, "")).filter(Boolean),
  );

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  return preview.rows.map((raw, idx) => {
    const rowNumber = idx + 2; // +1 header
    const errors: string[] = [];

    let firstName = mapping.firstName ? String(raw[mapping.firstName] ?? "").trim() : "";
    let lastName = mapping.lastName ? String(raw[mapping.lastName] ?? "").trim() : "";
    const email = mapping.email ? String(raw[mapping.email] ?? "").trim() : "";
    const phone = mapping.phone ? normalizePhone(String(raw[mapping.phone] ?? "")) : "";
    const notes = mapping.notes ? String(raw[mapping.notes] ?? "").trim() : "";

    // Si el archivo trae "Nombre completo" en una sola columna y Apellido no está mapeado
    if (!mapping.lastName && firstName.includes(" ")) {
      const parts = firstName.split(/\s+/);
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ");
    }

    if (!firstName && !email && !phone) {
      errors.push("Fila vacía");
    } else if (!firstName) {
      errors.push("Nombre requerido");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Email inválido: ${email}`);
    }
    if (phone && !/^[+0-9 ()./-]{6,22}$/.test(phone)) {
      errors.push(`Teléfono inválido: ${phone}`);
    }

    const emailKey = email.toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");

    const duplicateInDb =
      Boolean(emailKey && existingEmails.has(emailKey)) ||
      Boolean(phoneDigits.length >= 6 && existingPhones.has(phoneDigits));

    const duplicateInFile =
      Boolean(emailKey && seenEmails.has(emailKey)) ||
      Boolean(phoneDigits.length >= 6 && seenPhones.has(phoneDigits));

    const isDuplicate = duplicateInDb || duplicateInFile;

    if (duplicateInDb) {
      errors.push("Ya existe un cliente con este email/teléfono");
    } else if (duplicateInFile) {
      errors.push("Duplicado dentro del archivo");
    }

    if (emailKey) seenEmails.add(emailKey);
    if (phoneDigits.length >= 6) seenPhones.add(phoneDigits);

    return {
      rowNumber,
      data: { firstName, lastName, email, phone, notes },
      errors,
      isValid: errors.length === 0,
      isDuplicate,
    };
  });
}

export function downloadImportTemplate(): void {
  exportToExcel(
    "plantilla_clientes",
    [
      { header: "Nombre", key: "firstName" },
      { header: "Apellido", key: "lastName" },
      { header: "Email", key: "email" },
      { header: "Teléfono", key: "phone" },
      { header: "Notas", key: "notes" },
    ],
    [
      {
        firstName: "Lucas",
        lastName: "Gómez",
        email: "lucas.gomez@mail.com",
        phone: "+54 9 11 4521-8890",
        notes: "Juega los jueves 20hs",
      },
      {
        firstName: "Valentina",
        lastName: "Sosa",
        email: "valentina.sosa@mail.com",
        phone: "+54 9 11 5890-1122",
        notes: "Prefiere cancha techada",
      },
      {
        firstName: "Matías",
        lastName: "Pereyra",
        email: "matias.pereyra@mail.com",
        phone: "+54 9 11 6123-4455",
        notes: "",
      },
    ],
  );
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
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length + 4, 16) }));
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
