import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ROLE_COOKIE,
  isDemoRole,
  type DemoRole,
} from "@/lib/auth/demo-account";

/** Rol del usuario activo. Demo: cookie. Producción: complejo del perfil. */
export async function getActiveRole(): Promise<DemoRole> {
  if (isDemoMode()) {
    const store = await cookies();
    const value = store.get(DEMO_ROLE_COOKIE)?.value;
    return isDemoRole(value) ? value : "owner";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "operator";

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.platform_role === "platform_admin") return "platform";

  const { data: member } = await supabase
    .from("complex_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (member?.role === "complex_owner") return "owner";
  return "operator";
}

/** Rechaza el acceso si el usuario no tiene el rol mínimo pedido. */
export async function requireDemoRole(min: DemoRole): Promise<void> {
  if ((await getActiveRole()) !== min) {
    redirect("/dashboard");
  }
}