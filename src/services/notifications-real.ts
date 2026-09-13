import { getComplexScope } from "@/services/db";
import { createClient } from "@/lib/supabase/server";
import type { NotificationChannel, NotificationStatus } from "@/types/database";
import type {
  NotificationTemplate,
  NotificationRecord,
  NotificationSettings,
} from "@/services/notifications";

/** Implementación real (Supabase) de getNotificationData. Server-only. */
export async function getNotificationDataReal(): Promise<{
  templates: NotificationTemplate[];
  records: NotificationRecord[];
  settings: NotificationSettings;
}> {
  const scope = await getComplexScope();
  const supabase = await createClient();

  const [tplRes, notifRes, settingsRes] = await Promise.all([
    supabase
      .from("notification_templates")
      .select("id,template_key,channel,subject,body,is_active")
      .or(`complex_id.eq.${scope.complexId},complex_id.is.null`)
      .order("template_key", { ascending: true }),
    supabase
      .from("notifications")
      .select("id,channel,template_key,recipient,status,scheduled_at,sent_at,attempts,last_error,customer_id")
      .eq("complex_id", scope.complexId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("complex_settings")
      .select("reminder_24h_enabled,reminder_2h_enabled,allow_customer_cancellation")
      .eq("complex_id", scope.complexId)
      .maybeSingle(),
  ]);

  if (tplRes.error) throw new Error(tplRes.error.message);
  if (notifRes.error) throw new Error(notifRes.error.message);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  const customerIds = [...new Set((notifRes.data ?? []).map((n) => n.customer_id).filter(Boolean) as string[])];
  const customerMap = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data } = await supabase.from("customers").select("id,first_name,last_name").in("id", customerIds);
    for (const c of data ?? []) customerMap.set(c.id, `${c.first_name} ${c.last_name ?? ""}`.trim());
  }

  const templates: NotificationTemplate[] = (tplRes.data ?? []).map((t) => ({
    id: t.id,
    key: t.template_key,
    name: t.template_key.replace(/_/g, " "),
    channel: t.channel as NotificationChannel,
    subject: t.subject,
    body: t.body,
    is_active: t.is_active,
    usage: "",
  }));

  const records: NotificationRecord[] = (notifRes.data ?? []).map((n) => ({
    id: n.id,
    customer_name: n.customer_id ? customerMap.get(n.customer_id) ?? "—" : "—",
    channel: n.channel as NotificationChannel,
    template_key: n.template_key,
    recipient: n.recipient,
    status: n.status as NotificationStatus,
    scheduled_at: n.scheduled_at,
    sent_at: n.sent_at,
    attempts: n.attempts,
    last_error: n.last_error,
  }));

  const cs = settingsRes.data;
  const settings: NotificationSettings = {
    reminder_24h_enabled: cs?.reminder_24h_enabled ?? true,
    reminder_2h_enabled: cs?.reminder_2h_enabled ?? true,
    notify_admin_new_booking: true,
    notify_customer_confirmation: true,
    notify_customer_cancellation: true,
    respect_customer_channel_preference: true,
  };

  return { templates, records, settings };
}