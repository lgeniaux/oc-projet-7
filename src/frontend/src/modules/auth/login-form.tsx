"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginFields } from "@/modules/auth/schemas";
import { saveAuthToken } from "@/modules/auth/session";

/**
 * Sign in with Express and save the token for this tab.
 * @returns A login form with field and server errors.
 */
export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(fields: LoginFields) {
    setServerError("");
    try {
      const response = await fetch(
        new URL("/auth/login", process.env.NEXT_PUBLIC_API_URL),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      if (!response.ok) {
        if (response.status === 401) {
          setServerError("E-mail ou mot de passe incorrect.");
        } else if (response.status === 400) {
          setServerError(
            "Données de connexion invalides. Vérifiez les champs.",
          );
        } else {
          setServerError("La connexion est indisponible. Réessayez plus tard.");
        }
        return;
      }
      await saveAuthToken(response);
      router.replace("/");
    } catch {
      setServerError("La connexion est indisponible. Réessayez plus tard.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="h-12 w-full rounded-sm border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link aria-invalid:border-link"
          {...register("email")}
        />
        {errors.email && (
          <p
            id="login-email-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm">
          Mot de passe
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          className="h-12 w-full rounded-sm border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link aria-invalid:border-link"
          {...register("password")}
        />
        {errors.password && (
          <p
            id="login-password-error"
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
        {isSubmitting ? "Connexion en cours…" : "Se connecter"}
      </Button>
    </form>
  );
}
