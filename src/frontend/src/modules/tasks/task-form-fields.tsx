"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetError,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { accountErrorSchema } from "@/modules/account/schemas";
import type { Project } from "@/modules/projects/project-query";
import { taskStatuses } from "@/modules/tasks/task-status";

export const taskPriorities = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

// Title and description limits come from the Express task validation.
export const taskFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(200, "Le titre ne peut pas dépasser 200 caractères."),
  description: z
    .string()
    .trim()
    .min(1, "La description est obligatoire.")
    .max(1000, "La description ne peut pas dépasser 1000 caractères."),
  dueDate: z
    .string()
    .min(1, "L'échéance est obligatoire.")
    .pipe(z.iso.date("Saisissez une date d'échéance valide.")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
  assigneeIds: z.array(z.string()),
});

export type TaskFields = z.infer<typeof taskFieldsSchema>;
export type TaskStatus = TaskFields["status"];
type TaskMember = { id: string; email: string; name?: string | null };

const serverErrorMessages: Record<keyof TaskFields, string> = {
  title: "Le titre doit contenir entre 2 et 200 caractères.",
  description: "La description ne peut pas dépasser 1000 caractères.",
  dueDate: "Saisissez une date d'échéance valide.",
  priority: "Choisissez une des priorités proposées.",
  status: "Choisissez un des statuts proposés.",
  assigneeIds:
    "Une personne choisie ne fait plus partie du projet. La liste des membres a été actualisée : vérifiez les assignés.",
};

/**
 * List the people that Express accepts as assignees: the owner, then the members.
 * @param project - The project read from the API, if available.
 * @returns The assignable users.
 */
export function getAssignableMembers(project: Project | undefined) {
  if (!project) return [];
  return [project.owner, ...project.members.map((member) => member.user)];
}

/**
 * Show the errors of an Express 400 response on the matching task fields.
 * @param body - The JSON body of the 400 response.
 * @param setError - The form error setter.
 * @returns The fields that now show an error.
 */
export function showTaskFieldErrors(
  body: unknown,
  setError: UseFormSetError<TaskFields>,
) {
  const validation = accountErrorSchema.safeParse(body);
  const fields = new Set<keyof TaskFields>();
  if (!validation.success) return [];
  if (validation.data.error === "INVALID_ASSIGNEES") fields.add("assigneeIds");
  for (const error of validation.data.data?.errors ?? []) {
    // Express names each invalid list item, for example "assigneeIds[0]".
    const field = error.field.replace(/\[\d+\]$/, "");
    if (Object.hasOwn(serverErrorMessages, field))
      fields.add(field as keyof TaskFields);
  }
  for (const field of fields)
    setError(field, { message: serverErrorMessages[field] });
  return [...fields];
}

function FieldMessages({
  id,
  help,
  error,
}: {
  id: string;
  help?: string;
  error?: string;
}) {
  return (
    <>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-sm text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-link">
          {error}
        </p>
      )}
    </>
  );
}

function describedBy(id: string, hasHelp: boolean, hasError: boolean) {
  const ids = [hasHelp && `${id}-help`, hasError && `${id}-error`];
  return ids.filter(Boolean).join(" ") || undefined;
}

export function TaskFormFields({
  register,
  control,
  errors,
  members,
  statusOptions,
  assigneeNotice,
}: {
  register: UseFormRegister<TaskFields>;
  control: Control<TaskFields>;
  errors: FieldErrors<TaskFields>;
  members: TaskMember[];
  statusOptions: TaskStatus[];
  assigneeNotice?: string;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const dueDateId = `${id}-due-date`;
  const assigneesId = `${id}-assignees`;
  const priorityId = `${id}-priority`;
  const statusId = `${id}-status`;

  return (
    <>
      <div>
        <Label htmlFor={titleId} className="mb-1">
          Titre <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={titleId}
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={describedBy(titleId, true, !!errors.title)}
          {...register("title")}
        />
        <FieldMessages
          id={titleId}
          help="Entre 2 et 200 caractères."
          error={errors.title?.message}
        />
      </div>
      <div>
        <Label htmlFor={descriptionId} className="mb-1">
          Description <span aria-hidden="true">*</span>
        </Label>
        <Textarea
          id={descriptionId}
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={describedBy(
            descriptionId,
            true,
            !!errors.description,
          )}
          {...register("description")}
        />
        <FieldMessages
          id={descriptionId}
          help="1000 caractères maximum."
          error={errors.description?.message}
        />
      </div>
      <div>
        <Label htmlFor={dueDateId} className="mb-1">
          Échéance <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={dueDateId}
          type="date"
          aria-required="true"
          aria-invalid={!!errors.dueDate}
          aria-describedby={describedBy(dueDateId, false, !!errors.dueDate)}
          {...register("dueDate")}
        />
        <FieldMessages id={dueDateId} error={errors.dueDate?.message} />
      </div>
      <Controller
        control={control}
        name="assigneeIds"
        render={({ field }) => {
          const selected = members.filter((member) =>
            field.value.includes(member.id),
          );
          return (
            <div>
              <Label
                id={`${assigneesId}-label`}
                htmlFor={assigneesId}
                className="mb-1"
              >
                Assigné à
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={field.ref}
                    id={assigneesId}
                    type="button"
                    variant="outline"
                    aria-labelledby={`${assigneesId}-label ${assigneesId}`}
                    aria-invalid={!!errors.assigneeIds}
                    aria-describedby={describedBy(
                      assigneesId,
                      true,
                      !!errors.assigneeIds,
                    )}
                    className="h-auto w-full justify-between rounded-sm px-4 py-3 text-left text-base font-normal aria-invalid:border-link"
                  >
                    {selected.length > 0 ? (
                      <span className="min-w-0 wrap-anywhere">
                        {selected
                          .map((member) => member.name || member.email)
                          .join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted">
                        Choisir un ou plusieurs collaborateurs
                      </span>
                    )}
                    <ChevronDown aria-hidden="true" className="shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  aria-label="Membres du projet"
                  className="max-h-60 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
                >
                  {members.map((member) => (
                    <DropdownMenuCheckboxItem
                      key={member.id}
                      checked={field.value.includes(member.id)}
                      // Keep the menu open to choose several people.
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, member.id]
                            : field.value.filter((id) => id !== member.id),
                        )
                      }
                    >
                      <span className="min-w-0 wrap-anywhere">
                        {member.name || member.email}
                        {member.name && (
                          <span className="block text-muted">
                            {member.email}
                          </span>
                        )}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <FieldMessages
                id={assigneesId}
                help={[
                  "Seuls les membres du projet peuvent être assignés.",
                  assigneeNotice,
                ]
                  .filter(Boolean)
                  .join(" ")}
                error={errors.assigneeIds?.message}
              />
            </div>
          );
        }}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <div>
            <p id={priorityId} className="mb-2 text-sm font-medium">
              Priorité
            </p>
            <RadioGroup
              aria-labelledby={priorityId}
              value={field.value}
              onValueChange={field.onChange}
            >
              {Object.entries(taskPriorities).map(([value, label]) => (
                <RadioGroupItem
                  key={value}
                  value={value}
                  className="border-border bg-background text-text"
                >
                  {label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <div>
            <p id={statusId} className="mb-2 text-sm font-medium">
              Statut
            </p>
            <RadioGroup
              aria-labelledby={statusId}
              value={field.value}
              onValueChange={field.onChange}
            >
              {statusOptions.map((status) => (
                <RadioGroupItem
                  key={status}
                  value={status}
                  className={taskStatuses[status].className}
                >
                  {taskStatuses[status].label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
        )}
      />
    </>
  );
}
