"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFrenchCalendarDate } from "@/lib/format-date";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import {
  type ProjectTask,
  projectTasksResponseSchema,
} from "@/modules/projects/project-query";

const commentFieldsSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Saisissez un commentaire.")
    .max(2000, "Le commentaire ne peut pas dépasser 2 000 caractères."),
});
type CommentFields = z.infer<typeof commentFieldsSchema>;

const creationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    comment:
      projectTasksResponseSchema.shape.data.shape.tasks.element.shape.comments
        .element,
  }),
});

export function TaskComments({
  projectId,
  task,
}: {
  projectId: string;
  task: ProjectTask;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFields>({
    resolver: zodResolver(commentFieldsSchema),
    defaultValues: { content: "" },
  });

  async function onSubmit(fields: CommentFields) {
    setServerError("");
    setSuccess(false);
    try {
      const response = await authenticatedFetch(
        `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      if (response.status === 401) return;
      if (response.status === 403) {
        setServerError(
          "Vous n'avez plus l'autorisation de commenter cette tâche. Votre texte est conservé.",
        );
        return;
      }
      if (response.status === 404) {
        setServerError(
          "Cette tâche n'est plus disponible. Votre texte est conservé.",
        );
        return;
      }
      if (!response.ok) throw new Error("Comment creation unavailable");
      const body: unknown = await response.json();
      creationResponseSchema.parse(body);
      reset();
      setSuccess(true);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["projects", projectId, "tasks"],
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } catch {
      setServerError(
        "Impossible de publier le commentaire. Votre texte est conservé. Réessayez.",
      );
    }
  }

  return (
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
        <form
          aria-label={`Ajouter un commentaire à ${task.title}`}
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`${id}-content`}>
              Ajouter un commentaire <span aria-hidden="true">*</span>
            </Label>
            <Textarea
              id={`${id}-content`}
              aria-required="true"
              aria-invalid={Boolean(errors.content)}
              aria-describedby={`${id}-help${errors.content ? ` ${id}-error` : ""}`}
              disabled={isSubmitting}
              {...register("content")}
            />
            <p id={`${id}-help`} className="text-sm text-muted">
              Obligatoire, de 1 à 2 000 caractères après suppression des espaces
              de début et de fin.
            </p>
            {errors.content && (
              <p id={`${id}-error`} role="alert" className="text-sm text-link">
                {errors.content.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Publication…" : "Publier le commentaire"}
          </Button>
        </form>
      </CollapsibleContent>
      {serverError && (
        <p role="alert" className="py-4 text-sm text-link">
          {serverError}
        </p>
      )}
      {success && (
        <p role="status" className="py-4 text-sm">
          Commentaire publié.
        </p>
      )}
    </Collapsible>
  );
}
