import { z } from "zod";

export const reservationFormSchema = z
  .object({
    court_id: z.string().min(1, "Seleccioná una cancha"),
    customer_id: z.string().nullable(),
    starts_at: z.string().min(1, "Fecha y hora de inicio requeridas"),
    ends_at: z.string().min(1, "Fecha y hora de fin requeridas"),
    kind: z.enum(["booking", "block", "maintenance", "event"]),
    title: z.string().max(200).nullable(),
    notes: z.string().max(2000).nullable(),
  })
  .refine((d) => new Date(d.starts_at) < new Date(d.ends_at), {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["ends_at"],
  });

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;
