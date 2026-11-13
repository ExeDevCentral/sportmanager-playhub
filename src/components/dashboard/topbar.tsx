"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  ExternalLink,
  Globe2,
  Home,
  LogOut,
  Menu,
  Palette,
  UserCog,
  Volleyball,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useDashboardTheme();
  const initials = (user?.name ?? "DE")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rawDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const today = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Abrir menú">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {(demo || role) && (
        <div className="flex shrink-0 items-center gap-2 text-xs">
          {demo && (
            <span
              title="Modo demo · datos simulados"
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span>Demo</span>
            </span>
          )}
          {demo && role && <span className="text-border select-none">/</span>}
          {role && (
            <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 font-medium text-foreground">
              {role === "owner" ? (
                <Crown className="size-3 text-emerald-500 [[data-dashboard-theme='artistic']_&]:text-primary" />
              ) : role === "platform" ? (
                <Globe2 className="size-3 text-violet-500" />
              ) : (
                <UserCog className="size-3 text-muted-foreground" />
              )}
              <span>{DEMO_ROLE_SHORT[role]}</span>
              <span className="hidden font-normal text-muted-foreground sm:inline">
                ·{" "}
                {role === "owner"
                  ? "Acceso total"
                  : role === "platform"
                    ? "Red global"
                    : "Turnos y caja"}
              </span>
            </span>
          )}
        </div>
      )}

      <span className="hidden whitespace-nowrap text-xs font-medium text-muted-foreground xl:inline-block">
        {today}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/reservar"
          target="_blank"
          className="hidden sm:inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          title="Abrir portal de reservas para jugadores"
        >
          <Volleyball className="size-3.5 text-emerald-500" />
          <span>Portal Jugadores</span>
          <ExternalLink className="size-3 opacity-50" />
        </Link>

        <Link
          href="/"
          className="hidden lg:inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Volver a la página principal"
        >
          <Home className="size-3.5" />
          <span>Web</span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card/80 p-0.5">
          <Palette className="mx-1.5 hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
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
              className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                theme === value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {theme === value && <Check className="size-3" />}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 items-center gap-2 rounded-full px-1.5 py-1 outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-7">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden whitespace-nowrap text-xs font-medium sm:block">
                {user?.name ?? "Invitado"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name ?? "Invitado"}</p>
              {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
              {role && (
                <p className="mt-0.5 text-xs text-primary font-semibold">
                  {DEMO_ROLE_SHORT[role]} · {DEMO_ROLE_LABEL[role]}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/reservar" target="_blank" className="flex items-center gap-2 text-xs">
                <Volleyball className="size-4 text-emerald-600" />
                <span>Ver Portal de Jugadores</span>
                <ExternalLink className="ml-auto size-3 opacity-60" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center gap-2 text-xs">
                <Home className="size-4" />
                <span>Volver al Inicio / Web</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {demo && (
              <>
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cambiar Rol Demo
                </p>
                {role !== "owner" && (
                  <DropdownMenuItem onClick={() => setDemoRole("owner")}>
                    <Crown className="size-4 text-primary" />
                    Cambiar a Admin Dueño
                  </DropdownMenuItem>
                )}
                {role !== "operator" && (
                  <DropdownMenuItem onClick={() => setDemoRole("operator")}>
                    <UserCog className="size-4" />
                    Cambiar a Admin Operador
                  </DropdownMenuItem>
                )}
                {role !== "platform" && (
                  <DropdownMenuItem onClick={() => setDemoRole("platform")}>
                    <Globe2 className="size-4" />
                    Cambiar a Admin Plataforma
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserCog className="size-4" />
              <span>Mi perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-destructive focus:text-destructive">
                  <LogOut className="size-4" />
                  {demo ? "Cerrar sesión demo" : "Cerrar sesión"}
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Diálogo interactivo: Mi Perfil */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mi perfil</DialogTitle>
            <DialogDescription>
              Datos del usuario y permisos de la sesión actual en SportManager.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-2">
            <Avatar className="size-16 border-2 border-primary/20">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{user?.name ?? "Invitado"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email ?? "sin-email@sportmanager.app"}</p>
              {role && (
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    {DEMO_ROLE_SHORT[role]} · {DEMO_ROLE_LABEL[role]}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complejo activo</span>
              <span className="font-medium text-foreground">Padel Pro Club</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado de la cuenta</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Activo (Verificado)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modo</span>
              <span className="font-medium text-foreground">{demo ? "Evaluación Demo" : "Producción"}</span>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              asChild
              onClick={() => setProfileOpen(false)}
            >
              <Link href="/dashboard/configuracion">
                Ir a Configuración
              </Link>
            </Button>
            <Button size="sm" onClick={() => setProfileOpen(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}