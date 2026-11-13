"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Loader2,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Download,
  History,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  parseWorkbook,
  guessMapping,
  validateRows,
  exportToExcel,
  downloadImportTemplate,
  resultMessage,
  CAMPO_DESTINO,
  type ImportPreview,
  type ImportMapping,
  type ValidatedRow,
} from "@/lib/excel";
import { loadImportHistory, loadExistingCustomers } from "./actions";
import type { ImportJobSummary } from "@/services/excel";
import type { CustomerStats } from "@/types/database";
import { formatDate } from "@/lib/format";

const DEMO_CUSTOMERS_KEY = "sportmanager-demo-customers";

type Step = 1 | 2 | 3;
type ValidationFilter = "all" | "valid" | "errors";

export function ExcelClient() {
  const [step, setStep] = React.useState<Step>(1);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [mapping, setMapping] = React.useState<ImportMapping>({
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    notes: null,
  });
  const [validated, setValidated] = React.useState<ValidatedRow[]>([]);
  const [validationFilter, setValidationFilter] = React.useState<ValidationFilter>("all");
  const [existing, setExisting] = React.useState<{ email: string; phone: string }[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [history, setHistory] = React.useState<ImportJobSummary[]>([]);

  const bufferRef = React.useRef<ArrayBuffer | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([loadImportHistory(), loadExistingCustomers()])
      .then(([h, e]) => {
        if (cancelled) return;
        setHistory(h);
        let mergedExisting = e;
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(DEMO_CUSTOMERS_KEY);
            if (raw) {
              const localList = JSON.parse(raw) as CustomerStats[];
              if (Array.isArray(localList)) {
                mergedExisting = [
                  ...e,
                  ...localList.map((c) => ({
                    email: c.email ?? "",
                    phone: c.phone ?? "",
                  })),
                ];
              }
            }
          } catch {
            // ignore storage errors
          }
        }
        setExisting(mergedExisting);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const isSpreadsheet = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!isSpreadsheet) {
      toast.error("Formato no soportado", { description: "Usá un archivo .xlsx, .xls o .csv" });
      return;
    }
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      bufferRef.current = buf;
      const parsed = parseWorkbook(buf);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error("Archivo vacío", { description: "La hoja seleccionada no contiene filas con datos." });
        return;
      }
      setPreview(parsed);
      setMapping(guessMapping(parsed.headers));
      setFileName(file.name);
      setValidated([]);
      setValidationFilter("all");
      setStep(2);
      toast.success(`Archivo cargado: ${file.name}`, {
        description: `${parsed.rows.length} filas · hoja "${parsed.activeSheet}"`,
      });
    } catch {
      toast.error("No se pudo leer el archivo", {
        description: "Verificá que no esté dañado o protegido con contraseña.",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!bufferRef.current) return;
    try {
      const parsed = parseWorkbook(bufferRef.current, sheetName);
      setPreview(parsed);
      setMapping(guessMapping(parsed.headers));
      setValidated([]);
    } catch {
      toast.error("No se pudo cambiar de hoja");
    }
  };

  const runValidation = () => {
    if (!preview) return;
    if (!mapping.firstName) {
      toast.error("Mapeá la columna Nombre", {
        description: "Seleccioná qué columna del archivo corresponde al nombre del cliente.",
      });
      return;
    }
    const result = validateRows(preview, mapping, existing);
    setValidated(result);
    setValidationFilter("all");
    setStep(3);
  };

  const handleImport = () => {
    const validRows = validated.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const now = Date.now();
    const newCustomers: CustomerStats[] = validRows.map((row, index) => ({
      customer_id: `cust-imp-${now}-${index}`,
      complex_id: "demo-complex-001",
      first_name: row.data.firstName,
      last_name: row.data.lastName || null,
      phone: row.data.phone || null,
      email: row.data.email || null,
      birth_date: null,
      status: "active",
      notes: row.data.notes || null,
      preferred_contact_channel: row.data.phone ? "whatsapp" : "email",
      created_at: new Date().toISOString(),
      reservations_count: 0,
      last_reservation_at: null,
      cancellations_count: 0,
      no_shows_count: 0,
      total_spent: 0,
      favorite_court_id: null,
      favorite_court_name: null,
      favorite_hour: null,
    }));

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(DEMO_CUSTOMERS_KEY);
        const current = raw ? (JSON.parse(raw) as CustomerStats[]) : [];
        const merged = [...newCustomers, ...(Array.isArray(current) ? current : [])];
        window.localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(merged));
      } catch {
        // ignore storage quota error
      }
    }

    setExisting((prev) => [
      ...prev,
      ...validRows.map((r) => ({ email: r.data.email, phone: r.data.phone })),
    ]);

    toast.success("Importación completada", {
      description: `Se agregaron ${validRows.length} clientes a tu base. Ya podés verlos en la sección Clientes.`,
    });

    setHistory((prev) => [
      {
        id: `job-${now}`,
        file_name: fileName ?? "importacion.xlsx",
        sheet_name: preview?.activeSheet ?? null,
        entity_types: ["customers"],
        status: "completed",
        total_rows: validated.length,
        valid_rows: validRows.length,
        invalid_rows: validated.length - validRows.length,
        imported_rows: validRows.length,
        skipped_rows: validated.length - validRows.length,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    bufferRef.current = null;
    setStep(1);
    setPreview(null);
    setFileName(null);
    setValidated([]);
  };

  const handleExport = (kind: "customers" | "reservations" | "payments") => {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "customers") {
      exportToExcel(
        "clientes",
        [
          { header: "Nombre", key: "first" },
          { header: "Apellido", key: "last" },
          { header: "Email", key: "email" },
          { header: "Celular", key: "phone" },
          { header: "Reservas", key: "reservations" },
          { header: "Gasto total", key: "spent" },
        ],
        [
          { first: "Juan", last: "Pérez", email: "juan@mail.com", phone: "+5491100000001", reservations: 24, spent: "$384.000" },
          { first: "María", last: "González", email: "maria@mail.com", phone: "+5491100000002", reservations: 18, spent: "$298.000" },
          { first: "Carlos", last: "Ruiz", email: "carlos@mail.com", phone: "+5491100000003", reservations: 31, spent: "$512.000" },
          { first: "Ana", last: "Martínez", email: "ana@mail.com", phone: "+5491100000004", reservations: 9, spent: "$141.000" },
        ],
      );
    } else if (kind === "reservations") {
      exportToExcel(
        "reservas",
        [
          { header: "Fecha", key: "date" },
          { header: "Hora", key: "time" },
          { header: "Cancha", key: "court" },
          { header: "Cliente", key: "customer" },
          { header: "Precio", key: "price" },
          { header: "Estado", key: "status" },
        ],
        [
          { date: today, time: "18:00", court: "Cancha 1", customer: "Juan Pérez", price: "$16.000", status: "Confirmada" },
          { date: today, time: "19:00", court: "Cancha 2", customer: "María González", price: "$16.000", status: "Confirmada" },
          { date: today, time: "20:00", court: "Cancha 3", customer: "Carlos Ruiz", price: "$14.000", status: "Pendiente" },
          { date: today, time: "21:00", court: "Cancha 4", customer: "Ana Martínez", price: "$18.000", status: "Completada" },
        ],
      );
    } else {
      exportToExcel(
        "pagos",
        [
          { header: "Fecha", key: "date" },
          { header: "Cliente", key: "customer" },
          { header: "Concepto", key: "concept" },
          { header: "Monto", key: "amount" },
          { header: "Estado", key: "status" },
        ],
        [
          { date: today, customer: "Juan Pérez", concept: "Seña", amount: "$8.000", status: "Aprobado" },
          { date: today, customer: "María González", concept: "Pago total", amount: "$16.000", status: "Aprobado" },
          { date: today, customer: "Carlos Ruiz", concept: "Seña", amount: "$7.000", status: "Pendiente" },
        ],
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Importar / Exportar Excel</h1>
          <p className="text-sm text-muted-foreground">
            Importación inteligente de datos históricos y exportación de reportes.
          </p>
        </div>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* ── IMPORTAR ── */}
        <TabsContent value="import" className="mt-4 space-y-4">
          {/* Steps nav */}
          <div className="flex items-center gap-2 text-sm">
            <StepChip n={1} active={step === 1} done={step > 1} label="Subir archivo" />
            <ArrowRight className="size-4 text-muted-foreground" />
            <StepChip n={2} active={step === 2} done={step > 2} label="Mapear columnas" />
            <ArrowRight className="size-4 text-muted-foreground" />
            <StepChip n={3} active={step === 3} done={false} label="Validar e importar" />
          </div>

          {step === 1 && (
            <Card>
              <CardContent
                className={`flex cursor-pointer flex-col items-center gap-4 border-2 border-dashed p-12 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                {parsing ? (
                  <Loader2 className="size-10 animate-spin text-muted-foreground" />
                ) : (
                  <UploadCloud className="size-10 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Arrastrá tu archivo Excel aquí</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formatos .xlsx, .xls o .csv · Se detectan hojas, columnas y se validan duplicados
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline">Seleccionar archivo</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImportTemplate();
                    }}
                  >
                    <Download className="size-3.5" />
                    Descargar plantilla .xlsx
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && preview && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileCheck2 className="size-4 text-emerald-600" /> {fileName}
                        <Badge variant="secondary">{preview.rows.length} filas</Badge>
                      </CardTitle>
                      <CardDescription>
                        Hoja activa: <strong>{preview.activeSheet}</strong> · {preview.rows.length} filas ·{" "}
                        {preview.headers.length} columnas
                      </CardDescription>
                    </div>
                    {preview.sheets.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Hoja:</span>
                        <Select value={preview.activeSheet} onValueChange={handleSheetChange}>
                          <SelectTrigger className="h-8 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {preview.sheets.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(["firstName", "lastName", "email", "phone", "notes"] as const).map((key) => (
                      <div key={key} className="grid gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Campo destino: {CAMPO_DESTINO[key]}
                        </label>
                        <Select
                          value={mapping[key] ?? "__none__"}
                          onValueChange={(v) =>
                            setMapping((m) => ({ ...m, [key]: v === "__none__" ? null : v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="No mapear" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— No mapear —</SelectItem>
                            {preview.headers.map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Vista previa</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {preview.headers.slice(0, 6).map((h) => (
                          <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{i + 2}</TableCell>
                          {preview.headers.slice(0, 6).map((h) => (
                            <TableCell key={h} className="max-w-[160px] truncate text-xs">
                              {String(row[h] ?? "").slice(0, 40)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 size-4" /> Volver
                </Button>
                <Button onClick={runValidation}>
                  Validar datos <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resultado de la validación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-semibold">{validated.length}</p>
                      <p className="text-xs text-muted-foreground">Total filas</p>
                    </div>
                    <div className="rounded-lg border bg-emerald-50 p-3 text-center dark:bg-emerald-950/40">
                      <p className="text-2xl font-semibold text-emerald-600">
                        {validated.filter((r) => r.isValid).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Válidas</p>
                    </div>
                    <div className="rounded-lg border bg-red-50 p-3 text-center dark:bg-red-950/40">
                      <p className="text-2xl font-semibold text-red-600">
                        {validated.filter((r) => !r.isValid).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Con errores</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{resultMessage(validated)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Detalle de filas</CardTitle>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: "all", label: `Todas (${validated.length})` },
                        { id: "valid", label: `Válidas (${validated.filter((r) => r.isValid).length})` },
                        { id: "errors", label: `Errores (${validated.filter((r) => !r.isValid).length})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setValidationFilter(f.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          validationFilter === f.id
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="max-h-72 overflow-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validated
                        .filter((r) =>
                          validationFilter === "valid"
                            ? r.isValid
                            : validationFilter === "errors"
                              ? !r.isValid
                              : true
                        )
                        .slice(0, 100)
                        .map((r) => (
                        <TableRow key={r.rowNumber} className={r.isValid ? "" : "bg-red-50/40 dark:bg-red-950/20"}>
                          <TableCell className="text-xs text-muted-foreground">{r.rowNumber}</TableCell>
                          <TableCell>
                            {String(r.data.firstName ?? "")} {String(r.data.lastName ?? "")}
                          </TableCell>
                          <TableCell className="text-xs">{String(r.data.email ?? "")}</TableCell>
                          <TableCell className="text-xs">{String(r.data.phone ?? "")}</TableCell>
                          <TableCell>
                            {r.isValid ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="size-3.5" /> OK
                                {r.isDuplicate && " (dup)"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="size-3.5" /> {r.errors.join(" · ")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1 size-4" /> Ajustar mapeo
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validated.filter((r) => r.isValid).length === 0}
                  className="gap-2"
                >
                  <FileCheck2 className="size-4" />
                  Importar {validated.filter((r) => r.isValid).length} clientes
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── EXPORTAR ── */}
        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descargar reporte</CardTitle>
              <CardDescription>
                Genera el reporte en formato Excel (.xlsx). En producción se exportan datos reales; el demo usa datos de ejemplo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <ExportCard
                title="Clientes"
                desc="Todo el padrón con reservas y gasto"
                onClick={() => handleExport("customers")}
              />
              <ExportCard
                title="Reservas"
                desc="Turnos de un período por cancha"
                onClick={() => handleExport("reservations")}
              />
              <ExportCard
                title="Pagos"
                desc="Conciliación de cobros"
                onClick={() => handleExport("payments")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTORIAL ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Hoja</TableHead>
                    <TableHead>Filas</TableHead>
                    <TableHead className="text-right">Válidas</TableHead>
                    <TableHead className="text-right">Errores</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        <History className="mx-auto mb-1 size-5" />
                        Sin importaciones todavía
                      </TableCell>
                    </TableRow>
                  )}
                  {history.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.file_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{j.sheet_name ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{j.total_rows}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">{j.valid_rows}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">{j.invalid_rows}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(j.created_at)}
                      </TableCell>
                      <TableCell>
                        {j.status === "completed" ? (
                          <Badge className="gap-1"><CheckCircle2 className="size-3" /> Completado</Badge>
                        ) : j.status === "failed" ? (
                          <Badge variant="destructive" className="gap-1"><Ban className="size-3" /> Falló</Badge>
                        ) : (
                          <Badge variant="secondary">{j.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StepChip({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>
      <span
        className={`flex size-5 items-center justify-center rounded-full text-xs ${
          done ? "bg-emerald-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : n}
      </span>
      {label}
    </span>
  );
}

function ExportCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onClick} className="justify-self-start">
        <Download className="mr-1 size-4" /> Descargar .xlsx
      </Button>
    </div>
  );
}