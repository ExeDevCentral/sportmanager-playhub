/**
 * Modo demo: sin credenciales de Supabase el dashboard funciona con datos
 * mock deterministas para poder diseñar/validar la UX antes de conectar la BD.
 */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
