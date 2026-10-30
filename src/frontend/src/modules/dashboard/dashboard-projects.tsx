"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import {
  getProjectsByUrgency,
  type ProjectByUrgency,
} from "@/modules/dashboard/get-projects-by-urgency";
import { useProjectsWithTasksQuery } from "@/modules/dashboard/projects-with-tasks-query";
import { getProjectProgress } from "@/modules/projects/project-progress";
import { taskPriorities } from "@/modules/tasks/task-form-fields";
import { taskStatuses } from "@/modules/tasks/task-status";

export function DashboardProjects() {
  const projects = useProjectsWithTasksQuery();
  const projectsByUrgency = projects.data
    ? getProjectsByUrgency(projects.data)
    : undefined;

  return (
    <section
      aria-labelledby="dashboard-projects-heading"
      className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6 lg:p-8"
    >
      <h2
        id="dashboard-projects-heading"
        className="font-heading text-xl font-semibold"
      >
        Mes projets avec des tâches assignées
      </h2>
      <p className="mt-1 text-sm text-muted">
        Les plus urgents d’abord, selon votre prochaine tâche
      </p>
      {projects.isPending ? (
        <p role="status" className="mt-6 text-muted">
          Chargement de vos projets…
        </p>
      ) : (
        <>
          {projects.isError && (
            <div className="mt-6 space-y-4">
              <p role="alert" className="text-link">
                {projects.data
                  ? "L’actualisation de vos projets est indisponible. Les derniers projets restent affichés."
                  : "Vos projets sont indisponibles pour le moment. Réessayez."}
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
          {projectsByUrgency &&
            (projectsByUrgency.length === 0 ? (
              <p role="status" className="mt-6 text-muted">
                Aucun projet ne contient de tâche qui vous est assignée.
              </p>
            ) : (
              <ul
                aria-label="Projets avec des tâches assignées"
                className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {projectsByUrgency.map((projectByUrgency) => (
                  <DashboardProjectCard
                    key={projectByUrgency.project.id}
                    {...projectByUrgency}
                  />
                ))}
              </ul>
            ))}
        </>
      )}
    </section>
  );
}

// Priority badge colors. Each text color reaches WCAG AA on its background.
const priorityBadgeClassNames = {
  URGENT: "bg-status-todo text-on-action",
  HIGH: "bg-brand-soft text-link",
  MEDIUM: "bg-border text-text",
  LOW: "border border-border bg-surface text-muted",
};

/** One project card. The whole card is a link, as on the projects page. */
function DashboardProjectCard({ project, openTasks }: ProjectByUrgency) {
  const progress = getProjectProgress(project.tasks);
  const nextTask = openTasks.at(0);
  const headingId = `dashboard-project-${project.id}-heading`;

  return (
    <li className="min-w-0">
      <Link
        href={`/projects/${encodeURIComponent(project.id)}`}
        aria-labelledby={headingId}
        className="flex h-full min-w-0 flex-col rounded-md border border-border bg-surface p-6 transition-colors hover:border-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        <h3
          id={headingId}
          className="font-heading text-lg font-semibold wrap-anywhere"
        >
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm wrap-anywhere text-muted">
            {project.description}
          </p>
        )}

        <div className="mt-6 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Mes tâches</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress
            value={progress.percentage}
            aria-label={`Mes tâches terminées dans ${project.name}`}
          />
          <p className="text-xs text-muted">
            {progress.done}/{progress.total} tâches terminées
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted">Prochaine tâche</p>
            {nextTask ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="min-w-0 font-medium wrap-anywhere">
                    {nextTask.title}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${taskStatuses[nextTask.status].className}`}
                  >
                    {taskStatuses[nextTask.status].label}
                  </span>
                </div>
                <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <dt className="text-muted">Priorité :</dt>
                    <dd
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${priorityBadgeClassNames[nextTask.priority]}`}
                    >
                      {taskPriorities[nextTask.priority]}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-muted">Échéance :</dt>
                    <dd className="flex items-center gap-1.5 whitespace-nowrap">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted"
                      />
                      {nextTask.dueDate ? (
                        <time dateTime={nextTask.dueDate.slice(0, 10)}>
                          {formatFrenchCalendarDate(nextTask.dueDate)}
                        </time>
                      ) : (
                        "Aucune"
                      )}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Aucune tâche à faire ou en cours.
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
