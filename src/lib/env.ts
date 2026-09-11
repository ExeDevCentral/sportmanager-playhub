import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL requerida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY requerida"),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY requerida"),
});

function parse<T extends z.ZodType>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno faltantes o inválidas:\n${issues}\nCopiá .env.example a .env.local y completalo.`);
  }
  return result.data;
}

/** URL + anon key (seguro para el navegador). */
export function getSupabaseEnv() {
  return parse(envSchema, process.env);
}

/** Service role key — SOLO servidor. Nunca importar desde Client Components. */
export function getSupabaseServerEnv() {
  return parse(serverEnvSchema, process.env);
}
