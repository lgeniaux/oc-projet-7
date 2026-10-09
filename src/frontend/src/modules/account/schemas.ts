import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
} from "@/modules/auth/schemas";

export const accountErrorSchema = z.object({
  error: z.string().optional(),
  data: z
    .object({
      errors: z.array(z.object({ field: z.string(), message: z.string() })),
    })
    .optional(),
});

export const profileSchema = z.object({
  name: z.union([nameSchema, z.literal("")]),
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    newPassword: passwordSchema,
  })
  .refine((fields) => fields.currentPassword !== fields.newPassword, {
    path: ["newPassword"],
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
  });

export type ProfileFields = z.infer<typeof profileSchema>;
export type PasswordUpdateFields = z.infer<typeof passwordUpdateSchema>;
