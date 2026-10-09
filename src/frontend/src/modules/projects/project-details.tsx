"use client";

import { Button } from "@/components/ui/button";
import {
  ProjectRequestError,
  useProjectQuery,
} from "@/modules/projects/project-query";

export function ProjectDetails({ projectId }: { projectId: string }) {
  const project = useProjectQuery(projectId);
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

  return (
    <div className="mt-6 min-w-0">
      <h1 className="font-heading text-2xl font-semibold wrap-anywhere">
        {project.data.name}
      </h1>
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
      <p className="mt-8 rounded-md border border-border bg-surface p-6 text-muted">
        La consultation des tâches de ce projet sera disponible prochainement.
      </p>
    </div>
  );
}
