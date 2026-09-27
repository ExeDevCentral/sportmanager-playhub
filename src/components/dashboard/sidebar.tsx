"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-config";
import type { DemoRole } from "@/lib/auth/demo-account";

export function SidebarContent({
  role,
  onNavigate,
}: {
  role?: DemoRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const groups =
    role === "platform"
      ? NAV_GROUPS.filter((g) => g.items.some((item) => item.roles?.includes("platform"))).map((group) => ({
          ...group,
          items: group.items.filter((item) => item.roles?.includes("platform")),
        }))
      : role
        ? NAV_GROUPS.map((group) => ({
            ...group,
            items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
          })).filter((g) => g.items.length > 0)
        : NAV_GROUPS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
          S
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">SportManager</span>
          <span className="text-[11px] text-muted-foreground">Gestión deportiva</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer de navegación rápida para evaluación de portafolio */}
      <div className="border-t bg-muted/20 p-3">
        <div className="grid gap-1">
          <Link
            href="/reservar"
            target="_blank"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Portal de Jugadores
            </span>
            <span className="text-[10px] opacity-60">↗</span>
          </Link>
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span>Sitio Web / Landing</span>
            <span className="text-[10px] opacity-60">←</span>
          </Link>
        </div>
        <div className="mt-2 flex items-center justify-between px-2 pt-2 text-[10px] text-muted-foreground border-t border-border/40">
          <span>SportManager v1.2</span>
          <span className="font-semibold text-primary">Demo Activa</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ role, className }: { role?: DemoRole; className?: string }) {
  return (
    <aside className={cn("w-60 shrink-0 border-r bg-card", className)}>
      <SidebarContent role={role} />
    </aside>
  );
}