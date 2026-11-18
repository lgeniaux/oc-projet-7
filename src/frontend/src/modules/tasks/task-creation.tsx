"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toCalendarDateTime } from "@/lib/format-date";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import {
  projectTasksResponseSchema,
  useProjectQuery,
} from "@/modules/projects/project-query";
import { invalidateTaskViews } from "@/modules/tasks/invalidate-task-views";
import {
  getAssignableMembers,
  showTaskFieldErrors,
  TaskFormFields,
  taskFieldsSchema,
  type TaskFields,
} from "@/modules/tasks/task-form-fields";
import { taskStatuses } from "@/modules/tasks/task-status";

const creationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    task: projectTasksResponseSchema.shape.data.shape.tasks.element,
  }),
});

const emptyTask: TaskFields = {
  title: "",
  description: "",
  dueDate: "",
  priority: "MEDIUM",
  status: "TODO",
  assigneeIds: [],
};

export function TaskCreation({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const project = useProjectQuery(projectId);
  const members = getAssignableMembers(project.data);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{
    title: string;
    statusError: string;
  } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskFieldsSchema),
    defaultValues: emptyTask,
  });
  const path = `/projects/${encodeURIComponent(projectId)}/tasks`;

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    if (next) {
      reset(emptyTask);
      setServerError("");
    }
    setOpen(next);
  }

  async function onSubmit(fields: TaskFields) {
    setServerError("");
    setResult(null);
    const memberIds = new Set(members.map((member) => member.id));

    // Express ignores the status on creation: create the task first.
    let task;
    try {
      const response = await authenticatedFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title,
          description: fields.description,
          dueDate: toCalendarDateTime(fields.dueDate),
          priority: fields.priority,
          assigneeIds: fields.assigneeIds.filter((id) => memberIds.has(id)),
        }),
      });
      if (response.status === 401) return;
      if (response.status === 400) {
        const body: unknown = await response.json().catch(() => null);
        const fieldsWithError = showTaskFieldErrors(body, setError);
        if (fieldsWithError.includes("assigneeIds"))
          void queryClient.invalidateQueries({
            queryKey: ["projects", projectId],
            exact: true,
          });
        if (fieldsWithError.length === 0)
          setServerError("Données invalides. Vérifiez les champs.");
        return;
      }
      if (response.status === 403 || response.status === 404) {
        setServerError(
          "Ce projet n'existe plus ou vous n'y avez plus accès. Vos saisies sont conservées.",
        );
        return;
      }
      if (!response.ok) throw new Error("Task creation unavailable");
      const body: unknown = await response.json();
      task = creationResponseSchema.parse(body).data.task;
    } catch {
      setServerError(
        "La création de la tâche est indisponible. Vos saisies sont conservées. Réessayez.",
      );
      return;
    }

    // Then save the chosen status. The task stays "À faire" on failure.
    let statusError = "";
    if (fields.status !== "TODO") {
      statusError = `La tâche « ${task.title} » a été créée avec le statut « À faire », mais le statut « ${taskStatuses[fields.status].label} » n'a pas pu être enregistré. Modifiez la tâche pour changer son statut.`;
      try {
        const response = await authenticatedFetch(
          `${path}/${encodeURIComponent(task.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: fields.status }),
          },
        );
        if (response.status === 401) return;
        if (response.ok) statusError = "";
      } catch {
        // The message prepared above explains the failure.
      }
    }

    reset(emptyTask);
    setOpen(false);
    setResult({ title: task.title, statusError });
    void invalidateTaskViews(queryClient, projectId);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus aria-hidden="true" />
            Créer une tâche
          </Button>
        </DialogTrigger>
        <DialogContent closeLabel="Fermer la fenêtre de création de tâche">
          <DialogTitle>Créer une tâche</DialogTitle>
          <DialogDescription>
            Les champs marqués d&apos;un astérisque sont obligatoires.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
              <legend className="sr-only">Informations de la tâche</legend>
              <TaskFormFields
                register={register}
                control={control}
                errors={errors}
                members={members}
                statusOptions={["TODO", "IN_PROGRESS", "DONE"]}
              />
            </fieldset>
            {serverError && (
              <p role="alert" className="text-sm text-link">
                {serverError}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                "Création en cours…"
              ) : (
                <>
                  <Plus aria-hidden="true" />
                  Ajouter une tâche
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {result &&
        (result.statusError ? (
          <p role="alert" className="basis-full text-sm text-link">
            {result.statusError}
          </p>
        ) : (
          <p role="status" className="basis-full text-sm wrap-anywhere">
            Tâche « {result.title} » créée.
          </p>
        ))}
    </>
  );
}
