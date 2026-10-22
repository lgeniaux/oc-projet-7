"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toCalendarDateTime } from "@/lib/format-date";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import {
  type ProjectTask,
  useProjectQuery,
} from "@/modules/projects/project-query";
import { invalidateTaskViews } from "@/modules/tasks/invalidate-task-views";
import {
  getAssignableMembers,
  showTaskFieldErrors,
  TaskFormFields,
  taskFieldsSchema,
  type TaskFields,
  type TaskStatus,
} from "@/modules/tasks/task-form-fields";

/**
 * Menu, edit dialog and delete confirmation of one task card.
 * @param onDeleted - Called with the task title once the card and its dialogs are gone.
 */
export function TaskActions({
  projectId,
  task,
  onDeleted,
}: {
  projectId: string;
  task: ProjectTask;
  onDeleted: (title: string) => void;
}) {
  const queryClient = useQueryClient();
  const project = useProjectQuery(projectId);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const isDeletedRef = useRef(false);
  const [editOpen, setEditOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isTaskMissing, setIsTaskMissing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const members = getAssignableMembers(project.data);
  const memberIds = new Set(members.map((member) => member.id));
  const assignedIds = task.assignees.map(({ user }) => user.id);
  // Express keeps the assignments of a removed member (B12).
  const formerAssignees = task.assignees
    .filter(({ user }) => !memberIds.has(user.id))
    .map(({ user }) => user.name || user.email);
  const savedFields: TaskFields = {
    title: task.title,
    description: task.description ?? "",
    dueDate: task.dueDate?.slice(0, 10) ?? "",
    priority: task.priority,
    status: task.status,
    assigneeIds: assignedIds.filter((id) => memberIds.has(id)),
  };
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskFieldsSchema),
    defaultValues: savedFields,
  });
  const statusOptions: TaskStatus[] =
    task.status === "CANCELLED"
      ? ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]
      : ["TODO", "IN_PROGRESS", "DONE"];
  const path = `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`;

  function openEditor() {
    reset(savedFields);
    setServerError("");
    setIsTaskMissing(false);
    setSuccess(false);
    setEditOpen(true);
  }

  function changeEditOpen(next: boolean) {
    if (isSubmitting) return;
    if (!next && isTaskMissing)
      void invalidateTaskViews(queryClient, projectId);
    setEditOpen(next);
  }

  async function onSubmit(fields: TaskFields) {
    setServerError("");
    setSuccess(false);
    // Send only the changed fields.
    const changes: Record<string, unknown> = {};
    if (fields.title !== task.title) changes.title = fields.title;
    if (fields.description !== (task.description ?? ""))
      changes.description = fields.description;
    if (fields.dueDate !== (task.dueDate?.slice(0, 10) ?? ""))
      changes.dueDate = toCalendarDateTime(fields.dueDate);
    if (fields.priority !== task.priority) changes.priority = fields.priority;
    if (fields.status !== task.status) changes.status = fields.status;
    const assigneeIds = fields.assigneeIds.filter((id) => memberIds.has(id));
    // Express replaces the whole assignee list when assigneeIds is sent.
    if (
      assigneeIds.length !== assignedIds.length ||
      assigneeIds.some((id) => !assignedIds.includes(id))
    )
      changes.assigneeIds = assigneeIds;

    if (Object.keys(changes).length > 0) {
      try {
        const response = await authenticatedFetch(path, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
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
        if (response.status === 403) {
          setServerError(
            "Vous n'avez plus accès à ce projet. Vos saisies sont conservées.",
          );
          return;
        }
        if (response.status === 404) {
          setIsTaskMissing(true);
          setServerError(
            "Cette tâche n'existe plus. Fermez la fenêtre pour actualiser la liste.",
          );
          return;
        }
        if (!response.ok) throw new Error("Task update unavailable");
      } catch {
        setServerError(
          "Impossible d'enregistrer la tâche. Vos saisies sont conservées. Réessayez.",
        );
        return;
      }
      void invalidateTaskViews(queryClient, projectId);
    }
    setEditOpen(false);
    setSuccess(true);
  }

  async function deleteTask() {
    setDeleteError("");
    setIsDeleting(true);
    try {
      const response = await authenticatedFetch(path, { method: "DELETE" });
      if (response.status === 401) return;
      if (response.status === 403) {
        setDeleteError(
          "Vous n'avez pas l'autorisation de supprimer cette tâche.",
        );
        return;
      }
      // 404 means the task is already deleted: remove it from the views too.
      if (!response.ok && response.status !== 404)
        throw new Error("Task deletion unavailable");
      isDeletedRef.current = true;
      setDeleteOpen(false);
      queryClient.setQueryData<ProjectTask[]>(
        ["projects", projectId, "tasks"],
        (tasks) => tasks?.filter(({ id }) => id !== task.id),
      );
      void invalidateTaskViews(queryClient, projectId);
    } catch {
      setDeleteError("Impossible de supprimer la tâche. Réessayez.");
    } finally {
      setIsDeleting(false);
    }
  }

  function restoreFocus(event: Event) {
    event.preventDefault();
    if (isDeletedRef.current) onDeleted(task.title);
    else menuTriggerRef.current?.focus();
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {success && (
        <p role="status" className="text-sm">
          Tâche modifiée.
        </p>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuTriggerRef}
            type="button"
            variant="outline"
            aria-label={`Actions de la tâche « ${task.title} »`}
            className="w-12 p-0"
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={openEditor}>
            <Pencil aria-hidden="true" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setDeleteError("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 aria-hidden="true" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editOpen} onOpenChange={changeEditOpen}>
        <DialogContent
          closeLabel="Fermer la fenêtre de modification de tâche"
          onCloseAutoFocus={restoreFocus}
        >
          <DialogTitle>Modifier une tâche</DialogTitle>
          <DialogDescription>
            Les champs marqués d&apos;un astérisque sont obligatoires.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
              <TaskFormFields
                register={register}
                control={control}
                errors={errors}
                members={members}
                statusOptions={statusOptions}
                assigneeNotice={
                  formerAssignees.length > 0
                    ? `Ne font plus partie du projet : ${formerAssignees.join(", ")}. Leur assignation sera retirée à l'enregistrement.`
                    : undefined
                }
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
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!isDeleting) setDeleteOpen(next);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={restoreFocus}
          onEscapeKeyDown={(event) => {
            if (isDeleting) event.preventDefault();
          }}
        >
          <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
          <AlertDialogDescription>
            La tâche « {task.title} » et ses commentaires seront définitivement
            supprimés. Cette action est irréversible.
          </AlertDialogDescription>
          {deleteError && (
            <p role="alert" className="text-sm text-link">
              {deleteError}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteTask();
              }}
            >
              {isDeleting ? "Suppression…" : "Supprimer la tâche"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
