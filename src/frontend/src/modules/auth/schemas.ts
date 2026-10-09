import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "L'adresse e-mail est requise.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Adresse e-mail invalide.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Le nom doit contenir au moins 2 caractères.");

export const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&). Seuls les lettres non accentuées, chiffres et ces symboles sont autorisés.",
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis."),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;
