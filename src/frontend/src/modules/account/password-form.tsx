"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import {
  accountErrorSchema,
  passwordUpdateSchema,
  type PasswordUpdateFields,
} from "@/modules/account/schemas";

const passwordSuccessSchema = z.object({ success: z.literal(true) });

export function PasswordForm() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordUpdateFields>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(fields: PasswordUpdateFields) {
    setServerError("");
    setSuccess(false);
    try {
      const response = await authenticatedFetch("/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (response.status === 401) {
        const body: unknown = await response.json();
        const error = accountErrorSchema.safeParse(body);
        // The backend returns a 401 with a specific error code when the current password is invalid. A CHANGER DANS LE BACKEND PAR 400
        if (error.success && error.data.error === "INVALID_CURRENT_PASSWORD") {
          setError(
            "currentPassword",
            { message: "Le mot de passe actuel est incorrect." },
            { shouldFocus: true },
          );
        }
        return;
      }
      if (response.status === 400) {
        const body: unknown = await response.json();
        const validation = accountErrorSchema.safeParse(body);
        const fieldErrors = validation.success
          ? validation.data.data?.errors
          : undefined;
        let hasFieldError = false;
        for (const error of fieldErrors ?? []) {
          if (
            error.field === "currentPassword" ||
            error.field === "newPassword"
          ) {
            setError(
              error.field,
              {
                message:
                  error.field === "currentPassword"
                    ? "Le mot de passe actuel est requis."
                    : "Le nouveau mot de passe est invalide. Respectez les règles indiquées et choisissez un mot de passe différent de l'actuel.",
              },
              { shouldFocus: !hasFieldError },
            );
            hasFieldError = true;
          }
        }
        if (!hasFieldError)
          setServerError("Données invalides. Vérifiez les champs.");
        return;
      }
      if (!response.ok) throw new Error("Password update unavailable");
      const body: unknown = await response.json();
      passwordSuccessSchema.parse(body);
      reset();
      setSuccess(true);
    } catch {
      setServerError(
        "La modification du mot de passe est indisponible. Réessayez plus tard.",
      );
    }
  }

  return (
    <form
      aria-labelledby="password-heading"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <h2 id="password-heading" className="font-heading text-xl font-semibold">
        Mot de passe
      </h2>
      <div>
        <Label htmlFor="account-current-password" className="mb-1">
          Mot de passe actuel
        </Label>
        <Input
          id="account-current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={
            errors.currentPassword
              ? "account-current-password-error"
              : undefined
          }
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p
            id="account-current-password-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.currentPassword.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="account-new-password" className="mb-1">
          Nouveau mot de passe
        </Label>
        <Input
          id="account-new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          aria-describedby={
            errors.newPassword
              ? "account-new-password-help account-new-password-error"
              : "account-new-password-help"
          }
          {...register("newPassword")}
        />
        <p id="account-new-password-help" className="mt-1 text-sm text-muted">
          8 caractères minimum, avec une majuscule, une minuscule, un chiffre et
          un symbole parmi @ $ ! % * ? &. Utilisez uniquement des lettres non
          accentuées, des chiffres et ces symboles. Choisissez un mot de passe
          différent de l&apos;actuel.
        </p>
        {errors.newPassword && (
          <p
            id="account-new-password-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.newPassword.message}
          </p>
        )}
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-link">
          {serverError}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-text">
          Votre mot de passe a été modifié.
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Modification en cours…" : "Modifier le mot de passe"}
      </Button>
    </form>
  );
}
