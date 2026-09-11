import { isDemoMode } from "@/lib/demo";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export type EmailResult = {
  ok: boolean;
  id: string;
  provider: "demo" | "resend";
  error?: string;
};

const MAIL_FROM = process.env.EMAIL_FROM ?? "SportManager <no-reply@tudominio.com>";

/** Estdo del proveedor de email para la UI (solo server). */
export function getEmailSetup() {
  const fromMatch = /^\s*(.*?)\s*<\s*([^>]+)\s*>$/.exec(MAIL_FROM);
  return {
    configured: isDemoMode() ? false : Boolean(process.env.RESEND_API_KEY),
    demo: isDemoMode(),
    fromName: fromMatch?.[1] ?? "SportManager",
    fromEmail: fromMatch?.[2] ?? MAIL_FROM,
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Intercambia {placeholders} de una plantilla y devuelve HTML renderizable. */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

export function templateToHtml(body: string): string {
  return body
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px;color:#41524a;line-height:1.6">${line || "&nbsp;"}</p>`)
    .join("");
}

export function wrapEmailHtml(subject: string, contentHtml: string, complexName: string): string {
  return `<div style="background:#f2f7ee;padding:28px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ecdb">
    <div style="background:linear-gradient(135deg,#0d1713,#1c2a22);padding:24px 28px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#c9f36a;letter-spacing:-0.02em">${complexName}</p>
    </div>
    <div style="padding:28px">
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1c2a22">${subject}</p>
      ${contentHtml}
      <p style="margin:24px 0 0;font-size:12px;color:#8aa08f">Este mensaje fue generado por SportManager/PlayHub. Respondé al espacio para cualquier modificación.</p>
    </div>
  </div>
</div>`;
}

/** Envía el email. En demo se simula; con RESEND_API_KEY usa Resend. */
export async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 220));
    return { ok: true, id: makeId("demo"), provider: "demo" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, id: makeId("noop"), provider: "resend", error: "RESEND_API_KEY no configurado" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
    });
    const body = (await response.json()) as { id?: string };
    if (!response.ok) {
      return { ok: false, id: makeId("fail"), provider: "resend", error: JSON.stringify(body) };
    }
    return { ok: true, id: body.id ?? makeId("sent"), provider: "resend" };
  } catch (err) {
    return { ok: false, id: makeId("err"), provider: "resend", error: err instanceof Error ? err.message : String(err) };
  }
}