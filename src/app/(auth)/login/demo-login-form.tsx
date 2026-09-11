"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Crown, Globe2, KeyRound, Loader2, LogIn, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoSignIn, type AuthState } from "@/lib/auth/actions";
import { DEMO_ACCOUNT, DEMO_OPERATOR_ACCOUNT, DEMO_PLATFORM_ACCOUNT, DEMO_ROLE_SHORT, type DemoRole } from "@/lib/auth/demo-account";
import { cn } from "@/lib/utils";

export function DemoLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(demoSignIn, undefined);
  const [role, setRole] = useState<DemoRole>("owner");

  const isOwner = role === "owner";
  const isPlatform = role === "platform";
  const account = isOwner ? DEMO_ACCOUNT : isPlatform ? DEMO_PLATFORM_ACCOUNT : DEMO_OPERATOR_ACCOUNT;

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Acceso demo</p>
          <p className="text-xs text-muted-foreground">
            Sin Supabase conectado todavía: entrá al panel con un perfil de prueba.
          </p>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <form action={action} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="demo-email">Perfil demo</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                isOwner ? "border-primary/60 bg-primary/10" : "border-border hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Crown className={cn("size-4", isOwner ? "text-primary" : "text-muted-foreground")} />
                {DEMO_ROLE_SHORT.owner}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                Ve todo: precios, promociones, históricos y configuración.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("operator")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                !isOwner && !isPlatform ? "border-primary/60 bg-primary/10" : "border-border hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <UserCog className={cn("size-4", !isOwner && !isPlatform ? "text-primary" : "text-muted-foreground")} />
                {DEMO_ROLE_SHORT.operator}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                Día a día: calendario, reservas, clientes, pagos y reportes.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("platform")}
              className={cn(
                "col-span-2 flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                isPlatform ? "border-primary/60 bg-primary/10" : "border-border hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Globe2 className={cn("size-4", isPlatform ? "text-primary" : "text-muted-foreground")} />
                {DEMO_ROLE_SHORT.platform}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                Staff de SportManager: todos los complejos y su estado general.
              </span>
            </button>
          </div>
          <input type="hidden" name="role" value={role} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="demo-email">Email</Label>
          <Input
            id="demo-email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={account.email}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="demo-password">Contraseña</Label>
          <Input
            id="demo-password"
            name="password"
            type="text"
            autoComplete="current-password"
            defaultValue={account.password}
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Entrar al panel como {DEMO_ROLE_SHORT[role]}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {DEMO_ACCOUNT.email} — dueño · {DEMO_OPERATOR_ACCOUNT.email} — operador ·{" "}
          {DEMO_PLATFORM_ACCOUNT.email} — plataforma
        </p>
      </form>
    </div>
  );
}