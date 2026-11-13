"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Crown,
  Globe2,
  Loader2,
  LogIn,
  Sparkles,
  UserCog,
  Volleyball,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoSignIn, quickDemoSignIn, type AuthState } from "@/lib/auth/actions";
import {
  DEMO_ACCOUNT,
  DEMO_OPERATOR_ACCOUNT,
  DEMO_PLATFORM_ACCOUNT,
  DEMO_ROLE_LABEL,
  type DemoRole,
} from "@/lib/auth/demo-account";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [DEMO_ACCOUNT, DEMO_OPERATOR_ACCOUNT, DEMO_PLATFORM_ACCOUNT] as const;

export function DemoLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(demoSignIn, undefined);
  const [emailInput, setEmailInput] = useState<string>(DEMO_ACCOUNT.email);
  const [passwordInput, setPasswordInput] = useState<string>(DEMO_ACCOUNT.password);
  const [isQuickLogging, startQuickTransition] = useTransition();
  const [quickRoleTarget, setQuickRoleTarget] = useState<DemoRole | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const detectedAccount = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === emailInput.trim().toLowerCase()
  );

  const handleQuickLogin = (selectedRole: DemoRole) => {
    setQuickRoleTarget(selectedRole);
    startQuickTransition(async () => {
      await quickDemoSignIn(selectedRole);
    });
  };

  return (
    <div className="grid gap-5">
      {/* Banner de Bienvenida Demo */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-950 dark:text-emerald-200">
              Acceso por jerarquía · Modo Showcase
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Según el correo o perfil con el que ingreses, el sistema habilita automáticamente el panel y los permisos correspondientes a tu jerarquía. Hacé clic en cualquier rol para probarlo sin contraseña.
            </p>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {/* Acceso Rápido 1-Clic */}
      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Elegí tu rol para ingresar en 1 clic
        </p>

        {/* Dueño / Admin */}
        <button
          type="button"
          disabled={isQuickLogging || pending}
          onClick={() => handleQuickLogin("owner")}
          className="group relative flex flex-col gap-1.5 rounded-xl border-2 border-primary/40 bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md disabled:opacity-70"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Crown className="size-4.5" />
              </span>
              <div>
                <p className="font-bold text-foreground">Administrador / Dueño</p>
                <p className="text-[11px] text-muted-foreground">Recomendado para evaluar</p>
              </div>
            </div>
            {isQuickLogging && quickRoleTarget === "owner" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-xs transition-transform group-hover:translate-x-0.5">
                Entrar <ArrowRight className="size-3" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Acceso ilimitado: finanzas, ingresos, calendario de turnos, importador/exportador Excel, tarifas y promociones.
          </p>
        </button>

        {/* Operador */}
        <button
          type="button"
          disabled={isQuickLogging || pending}
          onClick={() => handleQuickLogin("operator")}
          className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/40 disabled:opacity-70"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <UserCog className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Operador de Canchas</p>
                <p className="text-[11px] text-muted-foreground">Gestión de turnos diaria</p>
              </div>
            </div>
            {isQuickLogging && quickRoleTarget === "operator" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                Entrar <ArrowRight className="size-3" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Día a día del club: disponibilidad en vivo, check-in de jugadores, cobro de señas y novedades.
          </p>
        </button>

        {/* Plataforma */}
        <button
          type="button"
          disabled={isQuickLogging || pending}
          onClick={() => handleQuickLogin("platform")}
          className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/40 disabled:opacity-70"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <Globe2 className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">SuperAdmin Multi-Club</p>
                <p className="text-[11px] text-muted-foreground">Visión de red global</p>
              </div>
            </div>
            {isQuickLogging && quickRoleTarget === "platform" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                Entrar <ArrowRight className="size-3" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Supervisión integral de múltiples complejos deportivos y estado general de servidores.
          </p>
        </button>
      </div>

      {/* Alternativa: Ingreso manual con credenciales */}
      <div className="border-t pt-3">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex w-full items-center justify-between py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>Ingresar con formulario tradicional</span>
          <ChevronDown
            className={cn("size-3.5 transition-transform", showManualForm && "rotate-180")}
          />
        </button>

        {showManualForm && (
          <form action={action} className="mt-3 grid gap-3 rounded-lg border bg-muted/30 p-3.5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                El sistema detecta tu jerarquía según el correo y habilita el dashboard correspondiente:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = acc.email === emailInput.trim().toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmailInput(acc.email);
                        setPasswordInput(acc.password);
                      }}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {acc.email}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="demo-email" className="text-xs">Email</Label>
              <Input
                id="demo-email"
                name="email"
                type="email"
                autoComplete="username"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="usuario@sportmanager.app"
                className="h-8 bg-background text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {detectedAccount ? (
                  <>
                    Panel habilitado:{" "}
                    <span className="font-semibold text-foreground">
                      {DEMO_ROLE_LABEL[detectedAccount.role]}
                    </span>
                  </>
                ) : (
                  "La jerarquía se asigna automáticamente según el correo registrado."
                )}
              </p>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="demo-password" className="text-xs">Contraseña</Label>
              <Input
                id="demo-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="h-8 bg-background text-xs"
              />
            </div>
            <Button type="submit" size="sm" disabled={pending || isQuickLogging} className="mt-1 w-full">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
              Entrar con credenciales
            </Button>
          </form>
        )}
      </div>

      {/* Enlaces de soporte de navegación */}
      <div className="flex flex-col gap-2 border-t pt-3 text-center sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a la Landing
        </Link>
        <Link
          href="/reservar"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          <Volleyball className="size-3.5" />
          Probar Portal de Reservas (Jugador)
        </Link>
      </div>
    </div>
  );
}