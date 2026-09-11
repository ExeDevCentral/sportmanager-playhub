"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { DEMO_ACCOUNT, DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth/demo-account";
import {
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  firstIssueText,
} from "@/lib/validations/auth";

export type AuthState = { error?: string; info?: string } | undefined;

async function getOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Ingreso por credenciales demo hardcodeadas (solo modo demo). */
export async function demoSignIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isDemoMode()) {
    return { error: "El acceso demo solo está disponible cuando no hay Supabase conectado." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (email !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    return { error: "Email o contraseña demo incorrectos" };
  }
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard");
}

export async function signInWithOAuth(provider: "google" | "apple"): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await getOrigin()}/auth/callback` },
  });
  if (error) {
    throw error;
  }
  redirect(data.url);
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithOAuth("google");
}

export async function signInWithApple(): Promise<void> {
  await signInWithOAuth("apple");
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueText(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : error.message,
    };
  }
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueText(parsed.error) };
  }
  const { firstName, lastName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback`,
      data: { first_name: firstName, last_name: lastName || undefined },
    },
  });
  if (error) {
    return { error: error.message };
  }

  // Si la confirmación por email está desactivada, ya hay sesión
  if (data.session) {
    redirect("/dashboard");
  }
  return { info: "Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja." };
}

export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueText(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await getOrigin()}/auth/callback` },
  });
  if (error) {
    return { error: error.message };
  }
  return { info: "Te enviamos un enlace mágico por email para ingresar." };
}

export async function signOut(): Promise<void> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_SESSION_COOKIE);
    redirect("/login");
    return;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
