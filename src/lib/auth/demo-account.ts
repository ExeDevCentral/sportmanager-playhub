/**
 * Cuenta demo hardcodeada.
 * En modo demo (sin Supabase) es la única vía de acceso al dashboard.
 * Cambiar credenciales, nombre o complejo aquí:
 */
export const DEMO_ACCOUNT = {
  email: "demo@sportmanager.app",
  password: "playhub2026",
  name: "Martina Demo",
  complex: "SportManager Club",
} as const;

export const DEMO_SESSION_COOKIE = "sm_demo_session";
export const DEMO_SESSION_VALUE = "active";