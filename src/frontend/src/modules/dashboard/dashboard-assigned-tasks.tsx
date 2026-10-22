"use client";

import Link from "next/link";
import { CalendarDays, Folder, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import {
  type AssignedTask,
  useAssignedTasksQuery,
} from "@/modules/dashboard/assigned-tasks-query";
import { getOpenAssignedTasks } from "@/modules/dashboard/get-open-assigned-tasks";
import { taskStatuses } from "@/modules/tasks/task-status";

function AssignedTaskCard({ task }: { task: AssignedTask }) {
  const status = taskStatuses[task.status];

  return (
    <li className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <dl className="flex min-w-0 flex-wrap gap-x-6 gap-y-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <dt>
              <Folder
                aria-hidden="true"
                className="size-4 shrink-0 text-muted"
              />
              <span className="sr-only">Projet</span>
            </dt>
            <dd className="min-w-0 wrap-anywhere">{task.project.name}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <CalendarDays
                aria-hidden="true"
                className="size-4 shrink-0 text-muted"
              />
              <span className="sr-only">Échéance</span>
            </dt>
            <dd>
              {task.dueDate ? (
                <time dateTime={task.dueDate.slice(0, 10)}>
                  {formatFrenchCalendarDate(task.dueDate)}
                </time>
              ) : (
                "Aucune échéance"
              )}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <MessageSquare
                aria-hidden="true"
                className="size-4 shrink-0 text-muted"
              />
              <span className="sr-only">Commentaires</span>
            </dt>
            <dd>{task.comments.length}</dd>
          </div>
        </dl>
        <Button asChild className="w-full sm:w-auto sm:min-w-28">
          <Link
            href={`/projects/${encodeURIComponent(task.project.id)}#task-${task.id}`}
            aria-label={`Voir la tâche « ${task.title} »`}
          >
            Voir
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function DashboardAssignedTasks() {
  const tasks = useAssignedTasksQuery();
  const openTasks = tasks.data ? getOpenAssignedTasks(tasks.data) : undefined;

  return (
    <section
      aria-labelledby="assigned-tasks-heading"
      className="mt-8 min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6 lg:p-8"
    >
      <h2
        id="assigned-tasks-heading"
        className="font-heading text-xl font-semibold"
      >
        Mes tâches assignées
      </h2>
      <p className="mt-1 text-sm text-muted">
        Par ordre de priorité, puis d’échéance
      </p>
      {tasks.isPending ? (
        <p role="status" className="mt-6 text-muted">
          Chargement des tâches assignées…
        </p>
      ) : (
        <>
          {tasks.isError && (
            <div className="mt-6 space-y-4">
              <p role="alert" className="text-link">
                {tasks.data
                  ? "L’actualisation des tâches assignées est indisponible. Les dernières tâches restent affichées."
                  : "Les tâches assignées sont indisponibles pour le moment. Réessayez."}
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
          {openTasks &&
            (openTasks.length === 0 ? (
              <p role="status" className="mt-6 text-muted">
                Aucune tâche en cours ou à faire ne vous est assignée.
              </p>
            ) : (
              <ul aria-label="Tâches assignées" className="mt-8 space-y-4">
                {openTasks.map((task) => (
                  <AssignedTaskCard key={task.id} task={task} />
                ))}
              </ul>
            ))}
        </>
      )}
    </section>
  );
}
