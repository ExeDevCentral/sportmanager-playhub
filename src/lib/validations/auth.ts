import { z } from "zod";

const email = z.email("Email inválido");
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const signInSchema = z.object({ email, password });

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresá tu nombre").max(50),
  lastName: z.string().trim().max(50).optional().or(z.literal("")),
  email,
  password,
});

export const magicLinkSchema = z.object({ email });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export function firstIssueText(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}
