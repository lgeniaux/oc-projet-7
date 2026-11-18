"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { accountErrorSchema } from "@/modules/account/schemas";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import { useProfileQuery } from "@/modules/auth/profile-query";
import { ContributorPicker } from "@/modules/projects/contributor-picker";
import {
  ProjectFormFields,
  projectFieldsSchema,
  type ProjectFields,
} from "@/modules/projects/project-form-fields";
import type { Project } from "@/modules/projects/project-query";
import type { Contributor } from "@/modules/projects/user-search-query";

type ContributorChanges = { add: Contributor[]; remove: Contributor[] };
type ContributorFailure = { user: Contributor; reason: string };
const contributorErrorSchema = z.object({ error: z.string() });

function getContributorChanges(
  baseline: Contributor[],
  selected: Contributor[],
  protectedIds: Set<string>,
): ContributorChanges {
  const baselineIds = new Set(baseline.map((user) => user.id));
  const selectedIds = new Set(selected.map((user) => user.id));
  return {
    add: selected.filter(
      (user) => !protectedIds.has(user.id) && !baselineIds.has(user.id),
    ),
    remove: baseline.filter(
      (user) => !protectedIds.has(user.id) && !selectedIds.has(user.id),
    ),
  };
}

export function ProjectEditing({
  project,
  canDelete,
  onDeleted,
}: {
  project: Project;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Contributor[]>([]);
  const [baseline, setBaseline] = useState<Contributor[]>([]);
  const [serverError, setServerError] = useState("");
  const [failures, setFailures] = useState<ContributorFailure[]>([]);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFields>({
    resolver: zodResolver(projectFieldsSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  });
  const path = `/projects/${encodeURIComponent(project.id)}`;

  function changeOpen(next: boolean) {
    if (isSubmitting || isDeleting) return;
    reset({ name: project.name, description: project.description ?? "" });
    const members = next
      ? project.members
          .map((member) => member.user)
          .filter((user) => user.id !== project.owner.id)
      : [];
    setSelected(members);
    setBaseline(members);
    setServerError("");
    setFailures([]);
    setFieldsSaved(false);
    setDeleteError("");
    setDeleteOpen(false);
    if (next) setSuccess(false);
    setOpen(next);
  }

  async function onSubmit(fields: ProjectFields) {
    setServerError("");
    setFailures([]);
    setFieldsSaved(false);
    setSuccess(false);
    const protectedIds = new Set([project.owner.id]);
    if (profile.data) protectedIds.add(profile.data.id);
    const changes = getContributorChanges(baseline, selected, protectedIds);
    let wrote = false;
    let savedFields = false;
    if (
      fields.name !== project.name ||
      fields.description !== (project.description ?? "")
    ) {
      try {
        const response = await authenticatedFetch(path, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (response.status === 401) return;
        if (response.status === 400) {
          const body: unknown = await response.json();
          const validation = accountErrorSchema.safeParse(body);
          let hasFieldError = false;
          for (const error of validation.success
            ? (validation.data.data?.errors ?? [])
            : []) {
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
            }
          }
          if (!hasFieldError)
            setServerError("Données invalides. Vérifiez les champs.");
          return;
        }
        if (response.status === 403) {
          setServerError(
            "Vous n'avez plus l'autorisation de modifier ce projet.",
          );
          return;
        }
        if (!response.ok) throw new Error("Project update unavailable");
        wrote = true;
        savedFields = true;
      } catch {
        setServerError("Impossible d'enregistrer le projet. Réessayez.");
        return;
      }
    }

    const memberFailures: ContributorFailure[] = [];
    let permissionDenied = false;
    for (const user of changes.add) {
      try {
        const response = await authenticatedFetch(`${path}/contributors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        if (response.status === 401) return;
        if (response.status === 403) {
          memberFailures.push({
            user,
            reason:
              "vous n'avez plus l'autorisation de modifier les contributeurs",
          });
          permissionDenied = true;
          break;
        }
        const body: unknown = response.ok
          ? null
          : await response.json().catch(() => null);
        const error = contributorErrorSchema.safeParse(body);
        if (
          response.ok ||
          (response.status === 409 &&
            error.success &&
            error.data.error === "USER_ALREADY_MEMBER")
        ) {
          wrote = true;
        } else {
          memberFailures.push({
            user,
            reason:
              response.status === 404 &&
              error.success &&
              error.data.error === "USER_NOT_FOUND"
                ? "introuvable"
                : "ajout impossible",
          });
        }
      } catch {
        memberFailures.push({ user, reason: "ajout impossible" });
      }
    }
    if (!permissionDenied) {
      for (const user of changes.remove) {
        try {
          const response = await authenticatedFetch(
            `${path}/contributors/${encodeURIComponent(user.id)}`,
            { method: "DELETE" },
          );
          if (response.status === 401) return;
          if (response.status === 403) {
            memberFailures.push({
              user,
              reason:
                "vous n'avez plus l'autorisation de modifier les contributeurs",
            });
            break;
          }
          if (response.ok) wrote = true;
          else memberFailures.push({ user, reason: "retrait impossible" });
        } catch {
          memberFailures.push({ user, reason: "retrait impossible" });
        }
      }
    }
    if (wrote) await queryClient.invalidateQueries({ queryKey: ["projects"] });
    if (memberFailures.length === 0) {
      setOpen(false);
      setSuccess(true);
      return;
    }
    const refreshed = queryClient.getQueryData<Project>([
      "projects",
      project.id,
    ]);
    const members = refreshed
      ? refreshed.members
          .map((member) => member.user)
          .filter((user) => user.id !== project.owner.id)
      : baseline;
    setBaseline(members);
    setSelected(members);
    setFieldsSaved(savedFields);
    setFailures(memberFailures);
  }

  async function deleteProject() {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await queryClient.cancelQueries({ queryKey: ["projects", project.id] });
      const response = await authenticatedFetch(path, { method: "DELETE" });
      if (response.status === 401) return;
      if (response.status === 403) {
        setDeleteError(
          "Vous n'avez pas l'autorisation de supprimer ce projet.",
        );
        return;
      }
      if (!response.ok) throw new Error("Project deletion unavailable");
      onDeleted();
    } catch {
      setDeleteError("Impossible de supprimer le projet. Réessayez.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-w-0">
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 border-transparent bg-transparent px-2 text-link underline hover:bg-transparent"
          >
            Modifier
          </Button>
        </DialogTrigger>
        <DialogContent closeLabel="Fermer la fenêtre de modification">
          <DialogTitle>Modifier un projet</DialogTitle>
          <DialogDescription>
            Les champs marqués d&apos;un astérisque sont obligatoires.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <fieldset
              disabled={isSubmitting || isDeleting}
              className="min-w-0 space-y-6"
            >
              <legend className="sr-only">Informations du projet</legend>
              <ProjectFormFields register={register} errors={errors} />
              <ContributorPicker
                description="Les personnes ajoutées auront le rôle de contributeur."
                ownerId={project.owner.id}
                selected={selected}
                onChange={setSelected}
              />
            </fieldset>
            {serverError && (
              <p role="alert" className="text-sm text-link">
                {serverError}
              </p>
            )}
            {failures.length > 0 && (
              <div role="alert" className="space-y-2 text-sm text-link">
                {fieldsSaved && (
                  <p>Le titre et la description ont été enregistrés.</p>
                )}
                <p>
                  Certaines modifications des contributeurs n&apos;ont pas été
                  enregistrées :
                </p>
                <ul className="list-disc space-y-1 pl-5 wrap-anywhere">
                  {failures.map(({ user, reason }) => (
                    <li key={user.id}>
                      {user.name?.trim() || user.email} : {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
          {canDelete && (
            <div className="space-y-4 border-t border-border pt-6">
              <p className="text-sm text-muted">
                La suppression est définitive : les tâches et commentaires du
                projet seront aussi supprimés.
              </p>
              <AlertDialog
                open={deleteOpen}
                onOpenChange={(next) => {
                  if (!isDeleting) {
                    setDeleteError("");
                    setDeleteOpen(next);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Supprimer le projet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  onEscapeKeyDown={(event) => {
                    if (isDeleting) event.preventDefault();
                  }}
                >
                  <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Le projet « {project.name} », ses tâches et ses commentaires
                    seront définitivement supprimés. Cette action est
                    irréversible.
                  </AlertDialogDescription>
                  {deleteError && (
                    <p role="alert" className="text-sm text-link">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel disabled={isDeleting}>
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleting}
                      onClick={(event) => {
                        event.preventDefault();
                        void deleteProject();
                      }}
                    >
                      {isDeleting ? "Suppression…" : "Supprimer le projet"}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {success && (
        <p role="status" className="text-sm">
          Projet modifié.
        </p>
      )}
    </div>
  );
}
