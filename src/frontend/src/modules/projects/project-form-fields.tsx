"use client";

import { useId } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const projectFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(100, "Le titre ne peut pas dépasser 100 caractères."),
  description: z
    .string()
    .trim()
    .max(500, "La description ne peut pas dépasser 500 caractères."),
});

export type ProjectFields = z.infer<typeof projectFieldsSchema>;

export function ProjectFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<ProjectFields>;
  errors: FieldErrors<ProjectFields>;
}) {
  const id = useId();
  const nameId = `${id}-name`;
  const descriptionId = `${id}-description`;
  return (
    <>
      <div>
        <Label htmlFor={nameId} className="mb-1">
          Titre <span aria-hidden="true">*</span>
        </Label>
        <Input
          id={nameId}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={
            errors.name ? `${nameId}-help ${nameId}-error` : `${nameId}-help`
          }
          {...register("name")}
        />
        <p id={`${nameId}-help`} className="mt-1 text-sm text-muted">
          Entre 2 et 100 caractères.
        </p>
        {errors.name && (
          <p
            id={`${nameId}-error`}
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor={descriptionId} className="mb-1">
          Description
        </Label>
        <Textarea
          id={descriptionId}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description
              ? `${descriptionId}-help ${descriptionId}-error`
              : `${descriptionId}-help`
          }
          {...register("description")}
        />
        <p id={`${descriptionId}-help`} className="mt-1 text-sm text-muted">
          Facultative, 500 caractères maximum.
        </p>
        {errors.description && (
          <p
            id={`${descriptionId}-error`}
            role="alert"
            className="mt-1 text-sm text-link"
          >
            {errors.description.message}
          </p>
        )}
      </div>
    </>
  );
}
