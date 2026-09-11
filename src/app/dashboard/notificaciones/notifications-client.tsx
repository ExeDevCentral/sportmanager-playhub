"use client";

import * as React from "react";
import { useActionState } from "react";
import { Bell, Mail, MessageCircle, Loader2, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { sendTestEmail } from "@/lib/notifications/actions";
import {
  getNotificationData,
  type NotificationTemplate,
  type NotificationRecord,
  type NotificationSettings,
} from "@/services/notifications";
import type { NotificationStatus } from "@/types/database";

type EmailSetup = {
  configured: boolean;
  demo: boolean;
  fromName: string;
  fromEmail: string;
};

const STATUS_VARIANT: Record<NotificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  queued: "secondary",
  sending: "secondary",
  failed: "destructive",
  skipped: "outline",
};

function NotifyBadge({ channel }: { channel: "email" | "whatsapp" }) {
  return channel === "email" ? (
    <Badge variant="outline" className="gap-1">
      <Mail className="size-3" /> Email
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1">
      <MessageCircle className="size-3" /> WhatsApp
    </Badge>
  );
}

const STATUS_LABEL: Record<NotificationStatus, string> = {
  sent: "Enviado",
  queued: "En cola",
  sending: "Enviando",
  failed: "Falló",
  skipped: "Omitido",
};

export function NotificationsClient({ emailSetup }: { emailSetup: EmailSetup }) {
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>([]);
  const [records, setRecords] = React.useState<NotificationRecord[]>([]);
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [testState, testAction, testPending] = useActionState(sendTestEmail, null);

  React.useEffect(() => {
    if (testState?.ok) {
      toast.success(`Email de prueba enviado (${testState.provider})`);
    } else if (testState) {
      toast.error("El email de prueba no se pudo enviar", { description: testState.error });
    }
  }, [testState]);

  React.useEffect(() => {
    let cancelled = false;
    getNotificationData()
      .then((data) => {
        if (cancelled) return;
        setTemplates(data.templates);
        setRecords(data.records);
        setSettings(data.settings);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Bell className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            Plantillas de email (Resend) y WhatsApp (Cloud API) y registro de envíos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="activity">Registro de envíos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* ── Plantillas (+ proveedor de email) ── */}
        <TabsContent value="templates" className="mt-4">
          <Card className="mb-4 border-emerald-600/20 bg-emerald-600/[0.04]">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="size-4" /> Proveedor de email
                </CardTitle>
                <CardDescription className="mt-1.5">
                  {emailSetup.demo
                    ? "En modo demo el envío se simula (no sale ningún correo real)."
                    : emailSetup.configured
                      ? `Resend conectado · ${emailSetup.fromName} <${emailSetup.fromEmail}>`
                      : "Falta RESEND_API_KEY para habilitar el envío real."}
                </CardDescription>
              </div>
              <Badge
                variant={emailSetup.demo ? "secondary" : emailSetup.configured ? "default" : "outline"}
              >
                {emailSetup.demo ? "Demo" : emailSetup.configured ? "Conectado" : "Sin configurar"}
              </Badge>
            </CardHeader>
            <CardContent>
              <form action={testAction} className="flex max-w-md gap-2">
                <Input name="email" type="email" placeholder="tu@email.com" required aria-label="Email de prueba" />
                <Button type="submit" disabled={testPending} size="sm">
                  {testPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Probar envío
                </Button>
              </form>
            </CardContent>
          </Card>
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Cargando plantillas…
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <NotifyBadge channel={t.channel} />
                        {t.name}
                      </CardTitle>
                      <CardDescription className="mt-1.5">{t.usage}</CardDescription>
                    </div>
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {t.subject && (
                      <p className="text-sm">
                        <span className="font-medium">Asunto:</span>{" "}
                        <span className="text-muted-foreground">{t.subject}</span>
                      </p>
                    )}
                    <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                      {t.body}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      Variables: <code className="text-foreground">{"{customer} {court} {date} {time} {complex}"}</code>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Registro ── */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Cargando envíos…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Plantilla</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.customer_name}</TableCell>
                        <TableCell><NotifyBadge channel={r.channel} /></TableCell>
                        <TableCell className="text-muted-foreground">{r.template_key}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.recipient}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(r.scheduled_at ?? new Date())}
                        </TableCell>
                        <TableCell>
                          {r.status === "failed" ? (
                            <span className="flex flex-col gap-0.5">
                              <Badge variant="destructive">{STATUS_LABEL[r.status]}</Badge>
                              <span className="max-w-[200px] truncate text-[10px] text-destructive">
                                {r.last_error}
                              </span>
                            </span>
                          ) : (
                            <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Configuración ── */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disparadores automáticos</CardTitle>
              <CardDescription>
                Qué notificaciones se envían de forma automática. En producción se respetan{" "}
                <code>reminder_24h_enabled</code> y <code>reminder_2h_enabled</code> del complejo.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow
                label="Recordatorio 24 h antes"
                description="Email al cliente un día antes del turno."
                checked={settings?.reminder_24h_enabled ?? false}
                onToggle={() => toggleSetting("reminder_24h_enabled")}
              />
              <SettingRow
                label="Recordatorio 2 h antes"
                description="WhatsApp dos horas antes del turno."
                checked={settings?.reminder_2h_enabled ?? false}
                onToggle={() => toggleSetting("reminder_2h_enabled")}
              />
              <SettingRow
                label="Notificar al staff por nueva reserva"
                description="Aviso interno cuando se registra una reserva online."
                checked={settings?.notify_admin_new_booking ?? false}
                onToggle={() => toggleSetting("notify_admin_new_booking")}
              />
              <SettingRow
                label="Confirmación al cliente"
                description="Confirmación cuando el pago es aprobado."
                checked={settings?.notify_customer_confirmation ?? false}
                onToggle={() => toggleSetting("notify_customer_confirmation")}
              />
              <SettingRow
                label="Aviso de cancelación"
                description="Notificar al cliente si se cancela la reserva."
                checked={settings?.notify_customer_cancellation ?? false}
                onToggle={() => toggleSetting("notify_customer_cancellation")}
              />
              <SettingRow
                label="Canal preferido del cliente"
                description="Enviar confirmaciones por email o WhatsApp según lo que eligió el cliente."
                checked={settings?.respect_customer_channel_preference ?? false}
                onToggle={() => toggleSetting("respect_customer_channel_preference")}
              />
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Edición de plantillas", {
                  description: "La edición avanzada de plantillas estará disponible en la próxima versión.",
                })
              }
            >
              <Pencil className="mr-1 size-4" /> Editar plantillas
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("Configuración guardada", {
                  description: "Los cambios quedan aplicados en esta sesión demo.",
                })
              }
            >
              Guardar configuración
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
