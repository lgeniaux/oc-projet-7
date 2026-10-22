"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import { getInitials } from "@/lib/get-initials";
import {
  type ProjectTask,
  useProjectTasksQuery,
} from "@/modules/projects/project-query";
import { sortProjectTasks } from "@/modules/projects/sort-project-tasks";
import { TaskActions } from "@/modules/tasks/task-actions";
import { TaskCreation } from "@/modules/tasks/task-creation";
import { taskStatuses } from "@/modules/tasks/task-status";

function ProjectTaskCard({
  projectId,
  task,
  onDeleted,
}: {
  projectId: string;
  task: ProjectTask;
  onDeleted: (title: string) => void;
}) {
  const status = taskStatuses[task.status];

  return (
    <li className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 font-heading text-lg font-semibold wrap-anywhere">
            {task.title}
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-sm ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <TaskActions projectId={projectId} task={task} onDeleted={onDeleted} />
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
      <Collapsible className="mt-6 border-t border-border pt-2">
        <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-sm text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link">
          <span>Commentaires ({task.comments.length})</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {task.comments.length === 0 ? (
            <p className="py-4 text-sm text-muted">Aucun commentaire.</p>
          ) : (
            <ul aria-label="Commentaires" className="space-y-4 py-4">
              {task.comments.map((comment) => (
                <li key={comment.id} className="rounded-sm bg-background p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium wrap-anywhere">
                      {comment.author.name || comment.author.email}
                    </span>
                    <time dateTime={comment.createdAt} className="text-muted">
                      {formatFrenchCalendarDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 wrap-anywhere whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function ProjectTaskList({ projectId }: { projectId: string }) {
  const tasks = useProjectTasksQuery(projectId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [deletionNotice, setDeletionNotice] = useState("");
  // The deleted card is gone: keep the focus in the task section.
  function announceDeletion(title: string) {
    setDeletionNotice(`Tâche « ${title} » supprimée.`);
    headingRef.current?.focus();
  }

  return (
    <section
      aria-labelledby="project-tasks-heading"
      className="mt-8 min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            ref={headingRef}
            id="project-tasks-heading"
            tabIndex={-1}
            className="rounded-sm font-heading text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Tâches
          </h2>
          <p className="mt-1 text-sm text-muted">
            Par ordre de priorité, puis d’échéance
          </p>
        </div>
        <TaskCreation projectId={projectId} />
        {deletionNotice && (
          <p role="status" className="basis-full text-sm wrap-anywhere">
            {deletionNotice}
          </p>
        )}
      </div>
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
                    onDeleted={announceDeletion}
                  />
                ))}
              </ul>
            ))}
        </>
      )}
    </section>
  );
}
