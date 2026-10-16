"use client";

import Link from "next/link";
import { Crown, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/get-initials";
import { useProfileQuery } from "@/modules/auth/profile-query";
import { ProjectCreation } from "@/modules/projects/project-creation";
import { getProjectProgress } from "@/modules/projects/project-progress";
import {
  type Project,
  useProjectsQuery,
  useProjectTasksQuery,
} from "@/modules/projects/project-query";

export function ProjectList() {
  return (
    <div className="mt-4">
      <ProjectCreation />
      <ProjectListContent />
    </div>
  );
}

function ProjectListContent() {
  const projects = useProjectsQuery();
  const profile = useProfileQuery();

  if (projects.isPending) {
    return (
      <p role="status" className="mt-8 text-muted">
        Chargement de vos projets…
      </p>
    );
  }

  if (!projects.data) {
    return (
      <div className="mt-8 space-y-4">
        <p role="alert" className="text-link">
          Vos projets sont indisponibles. Réessayez.
        </p>
        <Button
          variant="outline"
          disabled={projects.isFetching}
          onClick={() => void projects.refetch()}
        >
          {projects.isFetching ? "Chargement en cours…" : "Réessayer"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:mt-12">
      {projects.isError && (
        <div className="space-y-4">
          <p role="alert" className="text-link">
            L&apos;actualisation de vos projets est indisponible. Vos derniers
            projets restent affichés.
          </p>
          <Button
            variant="outline"
            disabled={projects.isFetching}
            onClick={() => void projects.refetch()}
          >
            {projects.isFetching ? "Chargement en cours…" : "Réessayer"}
          </Button>
        </div>
      )}
      {projects.data.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <p role="status" className="font-medium">
            Vous n&apos;avez pas encore de projet.
          </p>
          <p className="mt-2 text-muted">
            Vos projets apparaîtront ici lorsque vous en créerez un ou serez
            ajouté comme contributeur.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((project) => {
            let currentUserRole = profile.isPending
              ? "Chargement du rôle…"
              : "Rôle indisponible";
            if (profile.data) {
              currentUserRole =
                profile.data.id === project.owner.id
                  ? "Propriétaire"
                  : project.userRole === "ADMIN"
                    ? "Administrateur"
                    : "Contributeur";
            }

            return (
              <li key={project.id} className="min-w-0">
                <ProjectCard
                  project={project}
                  currentUserRole={currentUserRole}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  currentUserRole,
}: {
  project: Project;
  currentUserRole: string;
}) {
  const headingId = `project-${project.id}-heading`;
  const ownerName = project.owner.name?.trim() || project.owner.email;

  return (
    <Link
      href={`/projects/${encodeURIComponent(project.id)}`}
      aria-labelledby={headingId}
      className="flex h-full min-w-0 flex-col rounded-md border border-border bg-surface p-6 transition-colors hover:border-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:p-8"
    >
      <h2
        id={headingId}
        className="font-heading text-xl font-semibold wrap-anywhere"
      >
        {project.name}
      </h2>
      <p className="mt-2 text-sm wrap-anywhere whitespace-pre-wrap text-muted">
        {project.description || "Aucune description."}
      </p>
      <p className="mt-4 text-sm text-muted">
        Votre rôle : <span className="text-text">{currentUserRole}</span>
      </p>
      <div className="mt-8">
        <ProjectCardProgress project={project} />
      </div>
      <div className="mt-auto min-w-0 pt-8">
        <p className="flex items-center gap-2 text-sm text-muted">
          <UsersRound aria-hidden="true" className="size-4 shrink-0" />
          Équipe ({project.members.length + 1})
        </p>
        <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">
          <span className="relative inline-flex">
            <Avatar
              role="img"
              aria-label={`${ownerName}, Propriétaire`}
              title={`${ownerName}, Propriétaire`}
            >
              <AvatarFallback>
                <span aria-hidden="true">{getInitials(project.owner)}</span>
              </AvatarFallback>
            </Avatar>
            <Crown
              aria-hidden="true"
              className="absolute -top-4 left-1/2 size-3.5 -translate-x-1/2 text-link"
            />
          </span>
          {project.members.map((member) => {
            const memberName = member.user.name?.trim() || member.user.email;
            const memberRole =
              member.role === "ADMIN" ? "Administrateur" : "Contributeur";

            return (
              <Avatar
                key={member.user.id}
                role="img"
                aria-label={`${memberName}, ${memberRole}`}
                title={`${memberName}, ${memberRole}`}
              >
                <AvatarFallback className="bg-border">
                  <span aria-hidden="true">{getInitials(member.user)}</span>
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

function ProjectCardProgress({ project }: { project: Project }) {
  const tasks = useProjectTasksQuery(project.id);

  if (tasks.isPending) {
    return (
      <div className="space-y-2 text-sm text-muted">
        <p>Progression</p>
        <p role="status">Chargement de la progression…</p>
      </div>
    );
  }

  if (tasks.isError || !tasks.data) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted">Progression</p>
        <p role="status" className="text-link">
          La progression est indisponible.
        </p>
      </div>
    );
  }

  const progress = getProjectProgress(tasks.data);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted">Progression</span>
        <span>{progress.percentage}%</span>
      </div>
      <Progress
        value={progress.percentage}
        aria-label={`Progression du projet ${project.name}`}
      />
      <p className="text-xs text-muted">
        {progress.total === 0
          ? "Aucune tâche"
          : `${progress.done}/${progress.total} tâches terminées`}
      </p>
    </div>
  );
}
