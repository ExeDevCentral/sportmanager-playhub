"use client";

import { useState } from "react";
import { Check, Crown, Globe2, LogOut, Menu, FlaskConical, Palette, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut, setDemoRole } from "@/lib/auth/actions";
import { DEMO_ROLE_LABEL, DEMO_ROLE_SHORT, type DemoRole } from "@/lib/auth/demo-account";
import { SidebarContent } from "./sidebar";
import { useDashboardTheme } from "./dashboard-theme";

export type TopbarUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
};

export function Topbar({
  user,
  demo,
  role,
}: {
  user: TopbarUser | null;
  demo: boolean;
  role?: DemoRole;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useDashboardTheme();
  const initials = (user?.name ?? "DE")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {demo && (
        <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
          <FlaskConical className="size-3" />
          Modo demo · datos simulados
        </Badge>
      )}

      {role && (
        <Badge
          variant={role === "platform" ? "outline" : "secondary"}
          className={`gap-1 ${
            role === "owner" ? "bg-primary/10 text-primary" : role === "platform" ? "border-violet-600/30 bg-violet-600/10 text-violet-700 dark:text-violet-300" : ""
          }`}
        >
          {role === "owner" ? (
            <Crown className="size-3" />
          ) : role === "platform" ? (
            <Globe2 className="size-3" />
          ) : (
            <UserCog className="size-3" />
          )}
          {DEMO_ROLE_LABEL[role]}
        </Badge>
      )}

      <span className="hidden text-sm capitalize text-muted-foreground md:block">{today}</span>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-input bg-card/70 p-1">
          <Palette className="mx-1 size-3.5 text-muted-foreground" aria-hidden />
          {([
            ["formal", "Formal"],
            ["artistic", "Rosa gol"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              aria-label={`Usar tema ${label}`}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                theme === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {theme === value && <Check className="mr-1 inline size-3" />}
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
              <Avatar className="size-8">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">
                {user?.name ?? "Invitado"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name ?? "Invitado"}</p>
              {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
              {role && (
                <p className="mt-0.5 text-xs text-primary">
                  {DEMO_ROLE_SHORT[role]} · {DEMO_ROLE_LABEL[role]}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {demo && (
              <>
                {role !== "owner" && (
                  <DropdownMenuItem onClick={() => setDemoRole("owner")}>
                    <Crown className="size-4" />
                    Ver como Admin Dueño
                  </DropdownMenuItem>
                )}
                {role !== "operator" && (
                  <DropdownMenuItem onClick={() => setDemoRole("operator")}>
                    <UserCog className="size-4" />
                    Ver como Admin Operador
                  </DropdownMenuItem>
                )}
                {role !== "platform" && (
                  <DropdownMenuItem onClick={() => setDemoRole("platform")}>
                    <Globe2 className="size-4" />
                    Ver como Admin Plataforma
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild disabled>
              <span className="cursor-not-allowed opacity-60">Mi perfil (Fase 13)</span>
            </DropdownMenuItem>
            {!demo && (
              <>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </DropdownMenuItem>
                </form>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}