/**
 * Cuentas demo hardcodeadas (modo sin Supabase).
 * Cambiar credenciales, nombre o complejo aquí.
 */
export type DemoRole = "owner" | "operator";

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

export const DEMO_ROLE_VALUES: DemoRole[] = ["owner", "operator"];

export function isDemoRole(value: string | null | undefined): value is DemoRole {
  return value === "owner" || value === "operator";
}

export const DEMO_ROLE_LABEL: Record<DemoRole, string> = {
  owner: "Admin Dueño",
  operator: "Admin Operador",
};

export const DEMO_ROLE_SHORT: Record<DemoRole, string> = {
  owner: "Dueño",
  operator: "Operador",
};

export const DEMO_ROLE_DESCRIPTION: Record<DemoRole, string> = {
  owner: "Dueño del complejo · ve todo: precios, promociones, históricos, configuración.",
  operator: "Encargado del día a día · calendario, reservas, clientes, pagos y reportes.",
};

export const DEMO_SESSION_COOKIE = "sm_demo_session";
export const DEMO_SESSION_VALUE = "active";
export const DEMO_ROLE_COOKIE = "sm_demo_role";