import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";

/**
 * Proxy del navegador hacia el backend mock (:4000).
 * Relativo y mismo-origen: funciona local y en Vercel sin CORS.
 * Si el backend está caído responde 503 (el cliente hace fallback local).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = `${BACKEND}/api/${path.join("/")}${request.nextUrl.search}`;
  try {
    const res = await fetch(upstream, { cache: "no-store" });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "backend no disponible" }, { status: 503 });
  }
}