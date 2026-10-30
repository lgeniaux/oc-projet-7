"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignedTaskCard } from "@/modules/dashboard/assigned-task-card";
import { useAssignedTasksQuery } from "@/modules/dashboard/assigned-tasks-query";
import { AssignedTasksError } from "@/modules/dashboard/assigned-tasks-error";
import {
  formatCalendarMonth,
  getCalendarMonth,
  getMonthKanbanColumns,
  kanbanStatuses,
  shiftCalendarMonth,
} from "@/modules/dashboard/month-kanban";

const columnTitles = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminées",
};

export function DashboardMonthKanban() {
  const tasks = useAssignedTasksQuery();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getCalendarMonth(new Date()),
  );
  const columns = tasks.data
    ? getMonthKanbanColumns(tasks.data, visibleMonth)
    : undefined;

  return (
    <section aria-labelledby="month-tasks-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="month-tasks-heading"
            className="font-heading text-xl font-semibold"
          >
            Mes tâches du mois
          </h2>
          <p className="mt-1 text-sm text-muted">
            Selon leur échéance, par ordre de priorité
          </p>
        </div>
        <div
          role="group"
          aria-label="Mois affiché"
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            className="w-12 px-0"
            aria-label="Mois précédent"
            onClick={() =>
              setVisibleMonth(shiftCalendarMonth(visibleMonth, -1))
            }
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          {/* The new month is announced after each change. */}
          <p
            aria-live="polite"
            className="min-w-36 text-center font-medium first-letter:uppercase"
          >
            {formatCalendarMonth(visibleMonth)}
          </p>
          <Button
            variant="outline"
            className="w-12 px-0"
            aria-label="Mois suivant"
            onClick={() => setVisibleMonth(shiftCalendarMonth(visibleMonth, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
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
          {columns && (
            <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6">
              {kanbanStatuses.map((status) => {
                const columnTasks = columns[status];
                const headingId = `kanban-${status}-heading`;

                return (
                  <section
                    key={status}
                    aria-labelledby={headingId}
                    className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6"
                  >
                    <h3
                      id={headingId}
                      className="flex items-center gap-2 font-heading text-lg font-semibold"
                    >
                      {columnTitles[status]}{" "}
                      <span className="rounded-full bg-border px-3 py-0.5 font-sans text-sm font-normal">
                        {columnTasks.length}{" "}
                        <span className="sr-only">
                          {columnTasks.length > 1 ? "tâches" : "tâche"}
                        </span>
                      </span>
                    </h3>
                    {columnTasks.length === 0 ? (
                      <p className="mt-4 text-sm text-muted">
                        Aucune tâche ce mois-ci.
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-4">
                        {columnTasks.map((task) => (
                          <AssignedTaskCard
                            key={task.id}
                            task={task}
                            headingLevel={4}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
