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

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  phase?: number;
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
      { title: "Calendario", href: "/dashboard/calendario", icon: CalendarDays, phase: 5 },
      { title: "Reservas", href: "/dashboard/reservas", icon: ClipboardList, phase: 5 },
    ],
  },
  {
    label: "Clientes",
    items: [{ title: "Clientes", href: "/dashboard/clientes", icon: Users, phase: 8 }],
  },
  {
    label: "Complejo",
    items: [
      { title: "Canchas", href: "/dashboard/canchas", icon: Volleyball, phase: 4 },
      { title: "Horarios", href: "/dashboard/horarios", icon: Clock, phase: 4 },
      { title: "Precios", href: "/dashboard/precios", icon: Banknote, phase: 4 },
      { title: "Promociones", href: "/dashboard/promociones", icon: Percent, phase: 4 },
    ],
  },
  {
    label: "Finanzas",
    items: [{ title: "Pagos", href: "/dashboard/pagos", icon: CreditCard, phase: 6 }],
  },
  {
    label: "Insights",
    items: [
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3, phase: 10 },
      { title: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, phase: 10 },
    ],
  },
  {
    label: "Datos",
    items: [
      { title: "Históricos", href: "/dashboard/historicos", icon: History, phase: 9 },
      { title: "Importar Excel", href: "/dashboard/importar", icon: FileSpreadsheet, phase: 9 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Notificaciones", href: "/dashboard/notificaciones", icon: Bell, phase: 7 },
      { title: "Configuración", href: "/dashboard/configuracion", icon: Settings, phase: 4 },
    ],
  },
];
