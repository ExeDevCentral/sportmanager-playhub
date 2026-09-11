/**
 * Cuentas demo hardcodeadas (modo sin Supabase).
 * Cambiar credenciales, nombre o complejo aquí.
 */
export type DemoRole = "owner" | "operator" | "platform";

export const DEMO_ACCOUNT = {
  email: "demo@sportmanager.app",
  password: "playhub2026",
  name: "Martina Demo",
  complex: "SportManager Club",
  role: "owner" as DemoRole,
} as const;

export const DEMO_OPERATOR_ACCOUNT = {
  email: "operador@sportmanager.app",
  password: "playhub2026",
  name: "Ramiro Operador",
  complex: "SportManager Club",
  role: "operator" as DemoRole,
} as const;

export const DEMO_PLATFORM_ACCOUNT = {
  email: "platform@sportmanager.app",
  password: "playhub2026",
  name: "Débora Plataforma",
  complex: "SportManager PlayHub",
  role: "platform" as DemoRole,
} as const;

export const DEMO_ROLE_VALUES: DemoRole[] = ["owner", "operator", "platform"];

export function isDemoRole(value: string | null | undefined): value is DemoRole {
  return value === "owner" || value === "operator" || value === "platform";
}

export const DEMO_ROLE_LABEL: Record<DemoRole, string> = {
  owner: "Admin Dueño",
  operator: "Admin Operador",
  platform: "Admin Plataforma",
};

export const DEMO_ROLE_SHORT: Record<DemoRole, string> = {
  owner: "Dueño",
  operator: "Operador",
  platform: "Plataforma",
};

export const DEMO_ROLE_DESCRIPTION: Record<DemoRole, string> = {
  owner: "Dueño del complejo · ve todo: precios, promociones, históricos, configuración.",
  operator: "Encargado del día a día · calendario, reservas, clientes, pagos y reportes.",
  platform: "Staff de SportManager · ve todos los complejos y su estado general.",
};

export const DEMO_SESSION_COOKIE = "sm_demo_session";
export const DEMO_SESSION_VALUE = "active";
export const DEMO_ROLE_COOKIE = "sm_demo_role";