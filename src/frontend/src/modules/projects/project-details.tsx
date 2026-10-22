"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/get-initials";
import { useProfileQuery } from "@/modules/auth/profile-query";
import { ProjectEditing } from "@/modules/projects/project-editing";
import { OwnerCrown } from "@/modules/projects/owner-crown";
import { ProjectTaskList } from "@/modules/projects/project-task-list";
import {
  type Project,
  getProjectViewerRole,
  ProjectRequestError,
  useProjectQuery,
} from "@/modules/projects/project-query";

export function ProjectDetails({ projectId }: { projectId: string }) {
  const [isDeleted, setIsDeleted] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!isDeleted) return;
    async function leaveDeletedProject() {
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      queryClient.removeQueries({ queryKey: ["projects", projectId] });
      queryClient.setQueryData<Project[]>(["projects"], (list) =>
        list?.filter((project) => project.id !== projectId),
      );
      await queryClient.invalidateQueries({
        queryKey: ["projects"],
        exact: true,
        refetchType: "none",
      });
      router.replace("/projects");
    }
    void leaveDeletedProject();
  }, [isDeleted, projectId, queryClient, router]);

  return isDeleted ? (
    <p role="status">Projet supprimé. Retour à vos projets…</p>
  ) : (
    <ProjectDetailsContent
      projectId={projectId}
      onDeleted={() => setIsDeleted(true)}
    />
  );
}

function ProjectDetailsContent({
  projectId,
  onDeleted,
}: {
  projectId: string;
  onDeleted: () => void;
}) {
  const project = useProjectQuery(projectId);
  const profile = useProfileQuery();
  const isInaccessible =
    project.error instanceof ProjectRequestError &&
    (project.error.status === 403 || project.error.status === 404);

  if (project.isPending) {
    return (
      <div className="mt-6">
        <h1 className="font-heading text-2xl font-semibold">Projet</h1>
        <p role="status" className="mt-4 text-muted">
          Chargement du projet…
        </p>
      </div>
    );
  }

  if (isInaccessible) {
    return (
      <div className="mt-6">
        <h1 className="font-heading text-2xl font-semibold">
          Projet inaccessible
        </h1>
        <p role="alert" className="mt-4 text-link">
          Ce projet n&apos;existe pas ou vous n&apos;y avez pas accès.
        </p>
      </div>
    );
  }

  if (!project.data) {
    return (
      <div className="mt-6">
        <h1 className="font-heading text-2xl font-semibold">
          Projet indisponible
        </h1>
        <p role="alert" className="mt-4 text-link">
          Le projet est indisponible pour le moment. Réessayez.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          disabled={project.isFetching}
          onClick={() => void project.refetch()}
        >
          {project.isFetching ? "Chargement en cours…" : "Réessayer"}
        </Button>
      </div>
    );
  }
  const role = getProjectViewerRole(project.data, profile.data?.id);

  return (
    <div className="mt-6 min-w-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="min-w-0 font-heading text-2xl font-semibold wrap-anywhere">
          {project.data.name}
        </h1>
        {(role === "owner" || role === "admin") && (
          <ProjectEditing
            project={project.data}
            canDelete={role === "owner"}
            onDeleted={onDeleted}
          />
        )}
      </div>
      <p className="mt-4 wrap-anywhere whitespace-pre-wrap text-muted">
        {project.data.description || "Aucune description."}
      </p>
      {project.isError && (
        <div className="mt-6 space-y-4">
          <p role="alert" className="text-link">
            L&apos;actualisation du projet est indisponible. Ses dernières
            informations restent affichées.
          </p>
          <Button
            variant="outline"
            disabled={project.isFetching}
            onClick={() => void project.refetch()}
          >
            {project.isFetching ? "Chargement en cours…" : "Réessayer"}
          </Button>
        </div>
      )}
      <section
        aria-labelledby="project-contributors-heading"
        className="mt-8 flex min-w-0 flex-wrap items-center justify-between gap-6 rounded-md bg-border/30 p-4 sm:px-6"
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <h2
            id="project-contributors-heading"
            className="font-heading text-lg font-semibold"
          >
            Contributeurs
          </h2>
          <p className="text-sm text-muted">
            {project.data.members.length + 1}{" "}
            {project.data.members.length === 0 ? "personne" : "personnes"}
          </p>
        </div>
        <ul
          aria-label="Contributeurs du projet"
          className="flex min-w-0 flex-wrap gap-4"
        >
          {[
            { user: project.data.owner, isOwner: true },
            ...project.data.members.map(({ user }) => ({
              user,
              isOwner: false,
            })),
          ].map(({ user, isOwner }) => (
            <li
              key={user.id}
              className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
            >
              <span className="relative inline-flex">
                <Avatar aria-hidden="true" className="size-7">
                  <AvatarFallback
                    className={
                      isOwner ? "bg-brand-soft text-xs" : "bg-border text-xs"
                    }
                  >
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                {isOwner && <OwnerCrown />}
              </span>
              <span className="min-w-0 wrap-anywhere">
                {user.name || user.email}
                {isOwner && <span className="sr-only">, Propriétaire</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ProjectTaskList projectId={projectId} />
    </div>
  );
}
