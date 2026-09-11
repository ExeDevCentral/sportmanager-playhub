import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ACCOUNT, DEMO_OPERATOR_ACCOUNT, DEMO_PLATFORM_ACCOUNT, DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth/demo-account";
import { getActiveRole } from "@/lib/auth/role";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar, type TopbarUser } from "@/components/dashboard/topbar";
import { DashboardThemeProvider } from "@/components/dashboard/dashboard-theme";

export const dynamic = "force-dynamic";

const DEMO_USER_BY_ROLE = {
  owner: DEMO_ACCOUNT,
  operator: DEMO_OPERATOR_ACCOUNT,
  platform: DEMO_PLATFORM_ACCOUNT,
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  const role = await getActiveRole();
  let user: TopbarUser | null = null;

  if (demo) {
    const cookieStore = await cookies();
    const session = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    if (session !== DEMO_SESSION_VALUE) {
      redirect("/login?next=/dashboard");
    }
    const account = DEMO_USER_BY_ROLE[role];
    user = { name: account.name, email: account.email };
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

  return (
    <DashboardThemeProvider>
      <div className="dashboard-shell relative min-h-svh bg-background text-foreground">
        <div aria-hidden className="dashboard-backdrop pointer-events-none absolute inset-0" />
        <div className="relative z-10 flex min-h-svh">
          <Sidebar role={role} className="sticky top-0 z-30 hidden h-svh lg:flex lg:flex-col" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} demo={demo} role={role} />
            <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>
          </div>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}
