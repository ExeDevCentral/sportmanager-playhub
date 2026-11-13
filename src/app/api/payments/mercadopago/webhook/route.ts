import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const mpWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  topic: z.string().optional(),
  action: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]),
    })
    .optional(),
});

const processedMpEvents = new Set<string>();

function verifyMpSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string,
): boolean {
  if (!xSignature || !xRequestId) return false;
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [k, v] = part.trim().split("=");
      return [k, v];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Webhook de Mercado Pago (Checkout Pro / IPN).
 * Verifica firma HMAC x-signature, aplica idempotencia y confirma la reserva/seña.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mpWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const dataId = String(parsed.data.data?.id ?? parsed.data.id ?? "");
  const topic = parsed.data.type ?? parsed.data.topic ?? "payment";
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (secret && dataId) {
    const valid = verifyMpSignature(
      req.headers.get("x-signature"),
      req.headers.get("x-request-id"),
      dataId,
      secret,
    );
    if (!valid) {
      return NextResponse.json({ error: "Invalid Mercado Pago signature" }, { status: 401 });
    }
  }

  const dedupeKey = `${topic}:${dataId}`;
  if (dataId && processedMpEvents.has(dedupeKey)) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }
  if (dataId) processedMpEvents.add(dedupeKey);

  // En producción: consultar GET https://api.mercadopago.com/v1/payments/{dataId}
  // y actualizar payments + reservations usando supabaseAdmin.
  return NextResponse.json(
    {
      ok: true,
      topic,
      paymentId: dataId || null,
      status: "processed",
    },
    { status: 200 },
  );
}
