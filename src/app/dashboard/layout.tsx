import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ACCOUNT, DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth/demo-account";
import { getActiveRole } from "@/lib/auth/role";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar, type TopbarUser } from "@/components/dashboard/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  let user: TopbarUser | null = null;

  if (demo) {
    const cookieStore = await cookies();
    const session = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    if (session !== DEMO_SESSION_VALUE) {
      redirect("/login?next=/dashboard");
    }
    user = { name: DEMO_ACCOUNT.name, email: DEMO_ACCOUNT.email };
  } else {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      redirect("/login?next=/dashboard");
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("id", authUser.id)
      .maybeSingle();

    user = {
      name:
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
        authUser.email ||
        "Usuario",
      email: profile?.email ?? authUser.email ?? undefined,
      avatarUrl: profile?.avatar_url ?? undefined,
    };
  }

  const role = await getActiveRole();

  return (
    <div className="relative min-h-svh bg-[radial-gradient(62%_38%_at_88%_-2%,rgba(201,243,106,0.35),transparent_62%)] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(122,160,74,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(122,160,74,0.07)_1px,transparent_1px)] bg-[size:46px_46px]"
      />
      <div className="relative z-10 flex min-h-svh">
        <Sidebar role={role} className="sticky top-0 z-30 hidden h-svh lg:flex lg:flex-col" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} demo={demo} role={role} />
          <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
