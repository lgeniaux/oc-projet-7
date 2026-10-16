"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { accountErrorSchema } from "@/modules/account/schemas";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import { ContributorPicker } from "@/modules/projects/contributor-picker";
import { projectResponseSchema } from "@/modules/projects/project-query";
import type { Contributor } from "@/modules/projects/user-search-query";

const creationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(100, "Le titre ne peut pas dépasser 100 caractères."),
  description: z
    .string()
    .trim()
    .max(500, "La description ne peut pas dépasser 500 caractères."),
});

// The creation response has no userRole, unlike project read responses.
const creationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    project: projectResponseSchema.shape.data.shape.project.omit({
      userRole: true,
    }),
  }),
});
type CreationFields = z.infer<typeof creationSchema>;

export function ProjectCreation() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Contributor[]>([]);
  const [serverError, setServerError] = useState("");
  const [contributorError, setContributorError] = useState("");
  const [success, setSuccess] = useState<{
    name: string;
    missing: string[];
  } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreationFields>({
    resolver: zodResolver(creationSchema),
    defaultValues: { name: "", description: "" },
  });

  function changeOpen(next: boolean) {
    if (next && isSubmitting) return;
    if (next) {
      reset();
      setSelected([]);
      setServerError("");
      setContributorError("");
    }
    setOpen(next);
  }

  async function onSubmit(fields: CreationFields) {
    setServerError("");
    setContributorError("");
    setSuccess(null);
    const contributors = selected.map((user) => user.email);
    try {
      const response = await authenticatedFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          description: fields.description || undefined,
          contributors,
        }),
      });
      if (response.status === 401) return;
      if (response.status === 400) {
        const body: unknown = await response.json();
        const validation = accountErrorSchema.safeParse(body);
        const fieldErrors = validation.success
          ? validation.data.data?.errors
          : undefined;
        let hasFieldError = false;
        for (const error of fieldErrors ?? []) {
          if (error.field === "name" || error.field === "description") {
            setError(
              error.field,
              {
                message:
                  error.field === "name"
                    ? "Le titre doit contenir entre 2 et 100 caractères."
                    : "La description ne peut pas dépasser 500 caractères.",
              },
              { shouldFocus: !hasFieldError },
            );
            hasFieldError = true;
          } else if (
            error.field === "contributors" ||
            /^contributors\[\d+\]$/.test(error.field)
          ) {
            setContributorError(
              "Un contributeur est invalide. Retirez-le puis sélectionnez-le à nouveau.",
            );
            hasFieldError = true;
          }
        }
        if (!hasFieldError)
          setServerError("Données invalides. Vérifiez les champs.");
        return;
      }
      if (!response.ok) throw new Error("Project creation unavailable");
      const body: unknown = await response.json();
      const project = creationResponseSchema.parse(body).data.project;
      const memberEmails = new Set(
        project.members.map((member) => member.user.email.toLowerCase()),
      );
      const missing = contributors.filter(
        (email) => !memberEmails.has(email.toLowerCase()),
      );
      setSuccess({ name: project.name, missing });
      reset();
      setSelected([]);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch {
      setServerError(
        "La création du projet est indisponible. Vos saisies sont conservées. Réessayez.",
      );
    }
  }

  return (
    <div className="mb-8 space-y-4">
      <Dialog open={open} onOpenChange={changeOpen}>
        <div className="flex sm:justify-end">
          <DialogTrigger asChild>
            <Button>
              <Plus aria-hidden="true" className="size-4" />
              Créer un projet
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DialogTitle>Créer un projet</DialogTitle>
          <DialogDescription>
            Les champs marqués d&apos;un astérisque sont obligatoires.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
              <div>
                <Label htmlFor="project-name" className="mb-1">
                  Titre <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="project-name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name
                      ? "project-name-help project-name-error"
                      : "project-name-help"
                  }
                  {...register("name")}
                />
                <p id="project-name-help" className="mt-1 text-sm text-muted">
                  Entre 2 et 100 caractères.
                </p>
                {errors.name && (
                  <p
                    id="project-name-error"
                    role="alert"
                    className="mt-1 text-sm text-link"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="project-description" className="mb-1">
                  Description
                </Label>
                <Textarea
                  id="project-description"
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description
                      ? "project-description-help project-description-error"
                      : "project-description-help"
                  }
                  {...register("description")}
                />
                <p
                  id="project-description-help"
                  className="mt-1 text-sm text-muted"
                >
                  Facultative, 500 caractères maximum.
                </p>
                {errors.description && (
                  <p
                    id="project-description-error"
                    role="alert"
                    className="mt-1 text-sm text-link"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>
              <ContributorPicker
                selected={selected}
                onChange={setSelected}
                error={contributorError}
              />
            </fieldset>
            {serverError && (
              <p role="alert" className="text-sm text-link">
                {serverError}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Création en cours…" : "Ajouter un projet"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {!open && isSubmitting && <p role="status">Création en cours…</p>}
      {!open && serverError && (
        <p role="alert" className="text-sm text-link">
          {serverError}
        </p>
      )}
      {success && (
        <div role="status" className="space-y-2 wrap-anywhere">
          <p>Projet « {success.name} » créé.</p>
          {success.missing.length > 0 && (
            <p className="text-link">
              Le projet a été créé, mais ces contributeurs n&apos;ont pas été
              ajoutés : {success.missing.join(", ")}. Vérifiez les membres du
              projet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
