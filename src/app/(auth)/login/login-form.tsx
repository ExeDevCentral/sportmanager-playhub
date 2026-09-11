"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithMagicLink,
  signInWithPassword,
  signUp,
  type AuthState,
} from "@/lib/auth/actions";

export function LoginForm() {
  const [tab, setTab] = useState("signin");
  const searchParams = useSearchParams();
  const hasCallbackError = searchParams.get("error") !== null;

  const [signInState, signInAction, signInPending] = useActionState<AuthState, FormData>(
    signInWithPassword,
    undefined
  );
  const [signUpState, signUpAction, signUpPending] = useActionState<AuthState, FormData>(
    signUp,
    undefined
  );
  const [otpState, otpAction, otpPending] = useActionState<AuthState, FormData>(
    signInWithMagicLink,
    undefined
  );

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="signin">Ingresar</TabsTrigger>
        <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
        <TabsTrigger value="magic">Magic link</TabsTrigger>
      </TabsList>

      {hasCallbackError && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No pudimos completar el inicio de sesión. Intentá nuevamente.
        </p>
      )}

      <TabsContent value="signin" className="mt-4 grid gap-4">
        <StateMessage state={signInState} />
        <form action={signInAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" name="email" type="email" placeholder="tu@email.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signin-password">Contraseña</Label>
            <Input id="signin-password" name="password" type="password" required />
          </div>
          <Button type="submit" disabled={signInPending} className="w-full">
            {signInPending && <Loader2 className="size-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup" className="mt-4 grid gap-4">
        <StateMessage state={signUpState} />
        <form action={signUpAction} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="signup-first">Nombre</Label>
              <Input id="signup-first" name="firstName" placeholder="Juan" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-last">Apellido</Label>
              <Input id="signup-last" name="lastName" placeholder="Pérez" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" type="email" placeholder="tu@email.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input id="signup-password" name="password" type="password" minLength={8} required />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>
          <Button type="submit" disabled={signUpPending} className="w-full">
            {signUpPending && <Loader2 className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="magic" className="mt-4 grid gap-4">
        <StateMessage state={otpState} />
        <form action={otpAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input id="magic-email" name="email" type="email" placeholder="tu@email.com" required />
          </div>
          <Button type="submit" disabled={otpPending} variant="secondary" className="w-full">
            {otpPending && <Loader2 className="size-4 animate-spin" />}
            Enviar enlace mágico
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function StateMessage({ state }: { state: AuthState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.info) {
    return (
      <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
        {state.info}
      </p>
    );
  }
  return null;
}
