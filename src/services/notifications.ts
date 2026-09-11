import { isDemoMode } from "@/lib/demo";
import type { NotificationChannel, NotificationStatus } from "@/types/database";

export type NotificationTemplate = {
  id: string;
  key: string;
  name: string;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
  is_active: boolean;
  usage: string;
};

export type NotificationRecord = {
  id: string;
  customer_name: string;
  channel: NotificationChannel;
  template_key: string;
  recipient: string;
  status: NotificationStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
};

export type NotificationSettings = {
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  notify_admin_new_booking: boolean;
  notify_customer_confirmation: boolean;
  notify_customer_cancellation: boolean;
  respect_customer_channel_preference: boolean;
};

const DEMO_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl-1",
    key: "booking_confirmation",
    name: "Confirmación de reserva",
    channel: "email",
    subject: "Tu reserva en {complex} está confirmada",
    body: "Hola {customer},\n\nTu reserva de {court} el {date} a las {time} fue confirmada.\n\nDetalle: {detail}",
    is_active: true,
    usage: "Se envía cuando el pago es aprobado.",
  },
  {
    id: "tpl-2",
    key: "booking_reminder",
    name: "Recordatorio de reserva",
    channel: "email",
    subject: "Recordatorio: tu turno es mañana",
    body: "Hola {customer},\n\nTe recordamos tu turno de padel en {court} el {date} a las {time}.",
    is_active: true,
    usage: "24 h antes de la reserva.",
  },
  {
    id: "tpl-3",
    key: "booking_cancellation",
    name: "Cancelación de reserva",
    channel: "email",
    subject: "Tu reserva fue cancelada",
    body: "Hola {customer},\n\nTu reserva del {date} a las {time} en {court} fue cancelada.",
    is_active: true,
    usage: "Se envía al cancelar una reserva.",
  },
  {
    id: "tpl-4",
    key: "whatsapp_reminder",
    name: "Recordatorio de reserva",
    channel: "whatsapp",
    subject: null,
    body: "Hola {customer}! Recordá tu turno de padel mañana {date} {time} en {court}. ¡Nos vemos!",
    is_active: true,
    usage: "WhatsApp, 2 h antes de la reserva.",
  },
  {
    id: "tpl-5",
    key: "booking_confirmed_wa",
    name: "Confirmación de reserva",
    channel: "whatsapp",
    subject: null,
    body: "Hola {customer}, tu reserva en {court} el {date} a las {time} está confirmada. ¡Gracias por elegirnos!",
    is_active: false,
    usage: "WhatsApp al aprobar el pago (desactivada).",
  },
];

const DEMO_SEND_STATUS: NotificationStatus[] = ["sent", "sent", "sent", "failed", "queued", "sent", "sent"];
const DEMO_CHANNELS: NotificationChannel[] = ["email", "whatsapp", "email", "email", "whatsapp", "email", "whatsapp"];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_CUSTOMERS = [
  "Juan Pérez", "María González", "Carlos Ruiz", "Ana Martínez",
  "Pedro Sánchez", "Lucía Fernández", "Diego Torres",
];

function getDemoRecords(): NotificationRecord[] {
  const rand = mulberry32(20260909);
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(i / 2));
    date.setHours(9 + (i % 8), (i * 13) % 60, 0, 0);
    const channel = DEMO_CHANNELS[i % DEMO_CHANNELS.length]!;
    const status = DEMO_SEND_STATUS[i % DEMO_SEND_STATUS.length]!;
    const isQueued = status === "queued";
    const isFailed = status === "failed";
    return {
      id: `ntf-${100 + i}`,
      customer_name: DEMO_CUSTOMERS[Math.floor(rand() * DEMO_CUSTOMERS.length)]!,
      channel,
      template_key:
        channel === "whatsapp"
          ? i % 2 === 0 ? "whatsapp_reminder" : "booking_confirmed_wa"
          : ["booking_confirmation", "booking_reminder", "booking_cancellation"][i % 3]!,
      recipient: channel === "email" ? `${DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length]?.split(" ")[0]?.toLowerCase()}@mail.com` : "+5491" + String(10000000 + i * 99999),
      status,
      scheduled_at: date.toISOString(),
      sent_at: isQueued ? null : isFailed ? null : date.toISOString(),
      attempts: isFailed ? 2 : isQueued ? 0 : 1,
      last_error: isFailed ? "SMTP: timeout al conectar con el proveedor" : null,
    };
  });
}

function getDemoSettings(): NotificationSettings {
  return {
    reminder_24h_enabled: true,
    reminder_2h_enabled: true,
    notify_admin_new_booking: true,
    notify_customer_confirmation: true,
    notify_customer_cancellation: true,
    respect_customer_channel_preference: true,
  };
}

export async function getNotificationData(): Promise<{
  templates: NotificationTemplate[];
  records: NotificationRecord[];
  settings: NotificationSettings;
}> {
  if (isDemoMode()) {
    return {
      templates: DEMO_TEMPLATES,
      records: getDemoRecords(),
      settings: getDemoSettings(),
    };
  }
  // TODO(Fase 7 real): notification_templates + notifications + complex_settings
  throw new Error("Supabase no implementado aún (Fase 7).");
}
