import Link from "next/link";
import { CalendarDays, Folder, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { taskStatuses } from "@/modules/tasks/task-status";

/**
 * Show one assigned task as a list item with a link to its project context.
 * @param headingLevel - Level that keeps the page outline: 3 in the list, 4 in a Kanban column.
 */
export function AssignedTaskCard({
  task,
  headingLevel,
}: {
  task: AssignedTask;
  headingLevel: 3 | 4;
}) {
  const status = taskStatuses[task.status];
  const Heading = headingLevel === 3 ? "h3" : "h4";

  return (
    <li className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Heading className="min-w-0 font-heading text-lg font-semibold wrap-anywhere">
          {task.title}
        </Heading>
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
