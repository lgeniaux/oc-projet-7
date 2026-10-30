"use client";

import { AssignedTaskCard } from "@/modules/dashboard/assigned-task-card";
import { useAssignedTasksQuery } from "@/modules/dashboard/assigned-tasks-query";
import { AssignedTasksError } from "@/modules/dashboard/assigned-tasks-error";
import { getOpenAssignedTasks } from "@/modules/dashboard/get-open-assigned-tasks";

export function DashboardAssignedTasks() {
  const tasks = useAssignedTasksQuery();
  const openTasks = tasks.data ? getOpenAssignedTasks(tasks.data) : undefined;

  return (
    <section
      aria-labelledby="assigned-tasks-heading"
      className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6 lg:p-8"
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
            <AssignedTasksError
              hasTasks={tasks.data !== undefined}
              isRetrying={tasks.isFetching}
              onRetry={() => void tasks.refetch()}
            />
          )}
          {openTasks &&
            (openTasks.length === 0 ? (
              <p role="status" className="mt-6 text-muted">
                Aucune tâche en cours ou à faire ne vous est assignée.
              </p>
            ) : (
              <ul aria-label="Tâches assignées" className="mt-8 space-y-4">
                {openTasks.map((task) => (
                  <AssignedTaskCard
                    key={task.id}
                    task={task}
                    headingLevel={3}
                  />
                ))}
              </ul>
            ))}
        </>
      )}
    </section>
  );
}
