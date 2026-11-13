import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard";
import { getPaymentsData } from "@/services/payments";
import { getCustomers } from "@/services/customers";
import { isDemoMode } from "@/lib/demo";

type DatasetKind = "daily" | "courts" | "payments" | "customers";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

/**
 * Feed estructurado para Power BI, Excel Power Query y Looker Studio.
 * GET /api/bi/feed?dataset=daily|courts|payments|customers&format=json|csv
 */
export async function GET(req: NextRequest) {
  const biToken = process.env.BI_FEED_TOKEN;
  if (!isDemoMode() && biToken) {
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const queryToken = req.nextUrl.searchParams.get("token");
    if (auth !== biToken && queryToken !== biToken) {
      return NextResponse.json({ error: "Unauthorized BI feed token" }, { status: 401 });
    }
  }

  const dataset = (req.nextUrl.searchParams.get("dataset") ?? "daily") as DatasetKind;
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  let rows: Record<string, unknown>[] = [];

  if (dataset === "daily") {
    const dash = await getDashboardData();
    rows = dash.last30Days.map((d) => ({
      fecha: d.date,
      etiqueta: d.label,
      ingresos_ars: d.revenue,
      reservas: d.reservations,
      cancelaciones: d.cancellations,
      no_shows: d.noShows,
      ticket_promedio: d.reservations > 0 ? Math.round(d.revenue / d.reservations) : 0,
    }));
  } else if (dataset === "courts") {
    const dash = await getDashboardData();
    rows = dash.courts.map((c) => ({
      cancha: c.court,
      ingresos_ars: c.revenue,
      reservas: c.reservations,
      ocupacion_pct: Math.round(c.occupancy),
      capacidad_horas: c.capacityHours ?? 300,
    }));
  } else if (dataset === "payments") {
    const pay = await getPaymentsData();
    rows = pay.payments.map((p) => ({
      id: p.id,
      fecha: p.created_at,
      cliente: p.customer_name ?? "",
      cancha: p.court_name ?? "",
      concepto: p.concept,
      medio: p.provider,
      monto_ars: p.amount,
      estado: p.status,
    }));
  } else if (dataset === "customers") {
    const customers = await getCustomers();
    rows = customers.map((c) => ({
      id: c.customer_id,
      nombre: `${c.first_name} ${c.last_name ?? ""}`.trim(),
      estado: c.status,
      canal_preferido: c.preferred_contact_channel ?? "",
      reservas: c.reservations_count,
      cancelaciones: c.cancellations_count,
      no_shows: c.no_shows_count,
      gasto_total_ars: c.total_spent,
      cancha_favorita: c.favorite_court_name ?? "",
      ultima_reserva: c.last_reservation_at ?? "",
    }));
  } else {
    return NextResponse.json({ error: "Invalid dataset" }, { status: 400 });
  }

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename="sportmanager_${dataset}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      dataset,
      generatedAt: new Date().toISOString(),
      count: rows.length,
      rows,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
