"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import {
  profileQueryKey,
  profileResponseSchema,
  type Profile,
} from "@/modules/auth/profile-query";
import {
  accountErrorSchema,
  profileSchema,
  type ProfileFields,
} from "@/modules/account/schemas";

export function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name ?? "", email: profile.email },
  });

  async function onSubmit(fields: ProfileFields) {
    setServerError("");
    setSuccess(false);
    // Express allows an omitted name but rejects clearing an existing name.
    if (!fields.name && profile.name) {
      setError(
        "name",
        { message: "Le nom doit contenir au moins 2 caractères." },
        { shouldFocus: true },
      );
      return;
    }
    try {
      const response = await authenticatedFetch("/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, name: fields.name || undefined }),
      });
      if (response.status === 401) return;
      if (response.status === 409) {
        setError(
          "email",
          { message: "Cette adresse e-mail est déjà utilisée." },
          { shouldFocus: true },
        );
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
          if (error.field === "name" || error.field === "email") {
            setError(
              error.field,
              {
                message:
                  error.field === "name"
                    ? "Le nom doit contenir au moins 2 caractères."
                    : "Adresse e-mail invalide.",
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
      if (!response.ok) throw new Error("Profile update unavailable");
      const body: unknown = await response.json();
      const updatedProfile = profileResponseSchema.parse(body).data.user;
      queryClient.setQueryData(profileQueryKey, updatedProfile);
      reset({ name: updatedProfile.name ?? "", email: updatedProfile.email });
      setSuccess(true);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
    } catch {
      setServerError(
        "La modification de vos informations est indisponible. Réessayez plus tard.",
      );
    }
  }

  return (
    <form
      aria-labelledby="profile-heading"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <h2 id="profile-heading" className="font-heading text-xl font-semibold">
        Informations
      </h2>
      <div>
        <Label htmlFor="account-name" className="mb-1">
          Nom
        </Label>
        <Input
          id="account-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "account-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p
            id="account-name-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="account-email" className="mb-1">
          E-mail
        </Label>
        <Input
          id="account-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "account-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="account-email-error"
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.email.message}
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
          Vos informations ont été mises à jour.
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting
          ? "Enregistrement en cours…"
          : "Modifier les informations"}
      </Button>
    </form>
  );
}
