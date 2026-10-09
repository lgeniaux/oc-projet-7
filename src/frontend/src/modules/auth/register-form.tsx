"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterFields } from "@/modules/auth/schemas";
import { saveAuthToken } from "@/modules/auth/session";

/**
 * Sign up with Express and save the token for this tab.
 * @returns A sign-up form with field and server errors.
 */
export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(fields: RegisterFields) {
    setServerError("");
    try {
      const response = await fetch(
        new URL("/auth/register", process.env.NEXT_PUBLIC_API_URL),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      if (!response.ok) {
        if (response.status === 409) {
          setServerError(
            "Cette adresse e-mail est déjà utilisée. Vous pouvez vous connecter.",
          );
        } else if (response.status === 400) {
          setServerError(
            "Données d'inscription invalides. Vérifiez les champs.",
          );
        } else {
          setServerError(
            "L'inscription est indisponible. Réessayez plus tard.",
          );
        }
        return;
      }
      await saveAuthToken(response);
      router.replace("/");
    } catch {
      setServerError("L'inscription est indisponible. Réessayez plus tard.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="register-name" className="mb-1 block text-sm">
          Nom
        </Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p
            id="register-name-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="register-email" className="mb-1 block text-sm">
          E-mail
        </Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="register-email-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="register-password" className="mb-1 block text-sm">
          Mot de passe
        </Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password
              ? "register-password-help register-password-error"
              : "register-password-help"
          }
          {...register("password")}
        />
        <p id="register-password-help" className="mt-1 text-xs text-muted">
          8 caractères minimum, avec une majuscule, une minuscule, un chiffre et
          un symbole parmi @ $ ! % * ? &.
        </p>
        {errors.password && (
          <p
            id="register-password-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.password.message}
          </p>
        )}
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-link">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Inscription en cours…" : "S'inscrire"}
      </Button>
    </form>
  );
}
