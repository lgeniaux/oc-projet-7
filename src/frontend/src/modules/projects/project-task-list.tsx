"use client";

import { CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import { getInitials } from "@/lib/get-initials";
import {
  type ProjectTask,
  useProjectTasksQuery,
} from "@/modules/projects/project-query";
import { sortProjectTasks } from "@/modules/projects/sort-project-tasks";
import { TaskComments } from "@/modules/tasks/task-comments";

const statuses = {
  TODO: { label: "À faire", className: "bg-status-todo-soft text-status-todo" },
  IN_PROGRESS: {
    label: "En cours",
    className: "bg-status-progress-soft text-status-progress",
  },
  DONE: {
    label: "Terminée",
    className: "bg-status-done-soft text-status-done",
  },
  CANCELLED: { label: "Annulée", className: "bg-border text-text" },
};

function ProjectTaskCard({
  projectId,
  task,
}: {
  projectId: string;
  task: ProjectTask;
}) {
  const status = statuses[task.status];

  return (
    <li className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 font-heading text-lg font-semibold wrap-anywhere">
          {task.title}
        </h3>
        <span className={`rounded-full px-3 py-1 text-sm ${status.className}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-2 wrap-anywhere whitespace-pre-wrap text-muted">
        {task.description || "Aucune description."}
      </p>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Échéance :</span>
        <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
        {task.dueDate ? (
          <time dateTime={task.dueDate.slice(0, 10)}>
            {formatFrenchCalendarDate(task.dueDate)}
          </time>
        ) : (
          "Aucune échéance"
        )}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Assigné à :</span>
        {task.assignees.length === 0 ? (
          <span>Non assignée</span>
        ) : (
          <ul
            aria-label="Personnes assignées"
            className="flex min-w-0 flex-wrap gap-3"
          >
            {task.assignees.map(({ id, user }) => (
              <li key={id} className="flex min-w-0 items-center gap-2">
                <Avatar aria-hidden="true" className="size-6">
                  <AvatarFallback className="bg-border text-xs">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 wrap-anywhere">
                  {user.name || user.email}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <TaskComments projectId={projectId} task={task} />
    </li>
  );
}

export function ProjectTaskList({ projectId }: { projectId: string }) {
  const tasks = useProjectTasksQuery(projectId);

  return (
    <section
      aria-labelledby="project-tasks-heading"
      className="mt-8 min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6 lg:p-8"
    >
      <h2
        id="project-tasks-heading"
        className="font-heading text-xl font-semibold"
      >
        Tâches
      </h2>
      <p className="mt-1 text-sm text-muted">
        Par ordre de priorité, puis d’échéance
      </p>
      {tasks.isPending ? (
        <p role="status" className="mt-6 text-muted">
          Chargement des tâches…
        </p>
      ) : (
        <>
          {tasks.isError && (
            <div className="mt-6 space-y-4">
              <p role="alert" className="text-link">
                {tasks.data
                  ? "L’actualisation des tâches est indisponible. Les dernières tâches restent affichées."
                  : "Les tâches sont indisponibles pour le moment. Réessayez."}
              </p>
              <Button
                variant="outline"
                disabled={tasks.isFetching}
                onClick={() => void tasks.refetch()}
              >
                {tasks.isFetching ? "Chargement en cours…" : "Réessayer"}
              </Button>
            </div>
          )}
          {tasks.data &&
            (tasks.data.length === 0 ? (
              <p className="mt-6 text-muted">Aucune tâche pour ce projet.</p>
            ) : (
              <ul aria-label="Tâches du projet" className="mt-8 space-y-4">
                {sortProjectTasks(tasks.data).map((task) => (
                  <ProjectTaskCard
                    key={task.id}
                    projectId={projectId}
                    task={task}
                  />
                ))}
              </ul>
            ))}
        </>
      )}
    </section>
  );
}
