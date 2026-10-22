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
import { accountErrorSchema } from "@/modules/account/schemas";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import { ContributorPicker } from "@/modules/projects/contributor-picker";
import { projectResponseSchema } from "@/modules/projects/project-query";
import type { Contributor } from "@/modules/projects/user-search-query";
import {
  ProjectFormFields,
  projectFieldsSchema,
  type ProjectFields,
} from "@/modules/projects/project-form-fields";

// The creation response has no userRole, unlike project read responses.
const creationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    project: projectResponseSchema.shape.data.shape.project.omit({
      userRole: true,
    }),
  }),
});

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
  } = useForm<ProjectFields>({
    resolver: zodResolver(projectFieldsSchema),
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

  async function onSubmit(fields: ProjectFields) {
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
        <DialogContent closeLabel="Fermer la fenêtre de création">
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
              <ProjectFormFields register={register} errors={errors} />
              <ContributorPicker
                description="Les personnes ajoutées auront le rôle de contributeur. Vous serez propriétaire du projet."
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
