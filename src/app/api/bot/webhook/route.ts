import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { BotInboundMessage, BotReply, BotWebhookResult } from "@/lib/bot/types";

const inboundSchema = z.object({
  provider: z.enum(["whatsapp_cloud", "twilio", "telegram", "n8n"]).default("whatsapp_cloud"),
  externalMessageId: z.string().min(1),
  channelPhoneNumberId: z.string().min(1),
  fromPhone: z.string().min(6),
  senderName: z.string().optional(),
  text: z.string().min(1),
  receivedAt: z.string().optional(),
});

// En producción reemplazar por índice único en Supabase (tabla bot_messages.external_message_id)
const processedMessages = new Set<string>();

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function resolveQuickIntent(message: BotInboundMessage): BotReply {
  const lower = message.text.toLowerCase();
  if (/disponib|horario|turno|cancha|libre/.test(lower)) {
    return {
      intent: "check_availability",
      text: "Consultando disponibilidad en tiempo real para tu complejo…",
    };
  }
  if (/precio|tarifa|cuanto|valor/.test(lower)) {
    return {
      intent: "check_prices",
      text: "Consultando tarifas vigentes por horario…",
    };
  }
  if (/reservar|quiero jugar|anotame/.test(lower)) {
    return {
      intent: "create_booking",
      text: "Para confirmar tu reserva indicame cancha, día y horario.",
    };
  }
  if (/cancelar|anular|baja/.test(lower)) {
    return {
      intent: "cancel_booking",
      text: "Verificando tus reservas activas para gestionar la cancelación…",
    };
  }
  if (/humano|persona|operador|ayuda/.test(lower)) {
    return {
      intent: "human_handoff",
      handoffToHuman: true,
      text: "Derivando tu consulta con el operador del complejo.",
    };
  }
  return {
    intent: "unknown",
    text: "¡Hola! Podés consultarme disponibilidad, precios o reservar tu cancha.",
  };
}

/** Verificación de webhook (Meta / WhatsApp Cloud API challenge). */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.BOT_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/** Recepción de mensajes entrantes del bot con verificación HMAC e idempotencia. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const webhookSecret = process.env.BOT_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers.get("x-hub-signature-256") ?? req.headers.get("x-bot-signature");
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = inboundSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bot payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const inbound: BotInboundMessage = {
    ...parsed.data,
    receivedAt: parsed.data.receivedAt ?? new Date().toISOString(),
  };

  if (processedMessages.has(inbound.externalMessageId)) {
    const dupResult: BotWebhookResult = { ok: true, duplicate: true };
    return NextResponse.json(dupResult, { status: 200 });
  }
  processedMessages.add(inbound.externalMessageId);

  const reply = resolveQuickIntent(inbound);
  const result: BotWebhookResult = {
    ok: true,
    duplicate: false,
    complexId: null, // En producción: resolver desde tabla complex_channels por channelPhoneNumberId
    reply,
  };

  return NextResponse.json(result, { status: 200 });
}
