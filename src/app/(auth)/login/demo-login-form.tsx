"use client";

import { useActionState } from "react";
import { Loader2, KeyRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoSignIn, type AuthState } from "@/lib/auth/actions";
import { DEMO_ACCOUNT } from "@/lib/auth/demo-account";

export function DemoLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(demoSignIn, undefined);

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Acceso demo</p>
          <p className="text-xs text-muted-foreground">
            Sin Supabase conectado todavía: entrá al panel de operación con estas credenciales.
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
          <Label htmlFor="demo-email">Email</Label>
          <Input
            id="demo-email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={DEMO_ACCOUNT.email}
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
            defaultValue={DEMO_ACCOUNT.password}
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Entrar al panel
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}
        </p>
      </form>
    </div>
  );
}