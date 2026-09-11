import {
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Percent,
  Settings,
  TrendingUp,
  Users,
  Volleyball,
  type LucideIcon,
} from "lucide-react";
import type { DemoRole } from "@/lib/auth/demo-account";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Si está presente, solo lo ven los roles listados. */
  roles?: DemoRole[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Reservas",
    items: [
      { title: "Calendario", href: "/dashboard/calendario", icon: CalendarDays },
      { title: "Reservas", href: "/dashboard/reservas", icon: ClipboardList },
    ],
  },
  {
    label: "Clientes",
    items: [{ title: "Clientes", href: "/dashboard/clientes", icon: Users }],
  },
  {
    label: "Complejo",
    items: [
      { title: "Canchas", href: "/dashboard/canchas", icon: Volleyball },
      { title: "Horarios", href: "/dashboard/horarios", icon: Clock },
      { title: "Precios", href: "/dashboard/precios", icon: Banknote, roles: ["owner"] },
      { title: "Promociones", href: "/dashboard/promociones", icon: Percent, roles: ["owner"] },
    ],
  },
  {
    label: "Finanzas",
    items: [{ title: "Pagos", href: "/dashboard/pagos", icon: CreditCard }],
  },
  {
    label: "Insights",
    items: [
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
      { title: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, roles: ["owner"] },
    ],
  },
  {
    label: "Datos",
    items: [
      { title: "Históricos", href: "/dashboard/historicos", icon: History, roles: ["owner"] },
      { title: "Importar Excel", href: "/dashboard/importar", icon: FileSpreadsheet, roles: ["owner"] },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Notificaciones", href: "/dashboard/notificaciones", icon: Bell },
      { title: "Configuración", href: "/dashboard/configuracion", icon: Settings, roles: ["owner"] },
    ],
  },
];
