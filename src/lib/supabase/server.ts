import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/env";

/** Cliente para Server Components, Server Actions y Route Handlers. Respeta RLS con la sesión del usuario. */
export async function createClient() {
  // cookies() primero: marca la ruta como dinámica ANTES de validar env
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabaseEnv();

  return createServerClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component (cookies de solo lectura).
          // El refresh de sesión lo garantiza el proxy (src/proxy.ts).
        }
      },
    },
  });
}
