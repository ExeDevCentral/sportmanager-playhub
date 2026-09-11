import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServerEnv } from "@/lib/env";

/**
 * Cliente admin con service_role (bypasea RLS).
 * USO EXCLUSIVO EN SERVIDOR: webhooks, workers de notificaciones, imports.
 * Nunca importar este módulo desde un Client Component ni exponer la key.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getSupabaseServerEnv();
  return createSupabaseClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
