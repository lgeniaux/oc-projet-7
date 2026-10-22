"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";

const projectUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
});

const projectRoleSchema = z.enum(["ADMIN", "CONTRIBUTOR"]);

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  owner: projectUserSchema,
  members: z.array(
    z.object({
      role: projectRoleSchema,
      user: projectUserSchema,
    }),
  ),
  _count: z.object({
    tasks: z.number().int().nonnegative(),
  }),
  userRole: projectRoleSchema,
});

const projectTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.iso.datetime({ offset: true }).nullable(),
  assignees: z.array(
    z.object({
      id: z.string(),
      user: projectUserSchema,
    }),
  ),
  comments: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      createdAt: z.iso.datetime({ offset: true }),
      author: projectUserSchema,
    }),
  ),
});

export const projectsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    projects: z.array(projectSchema),
  }),
});

export const projectResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    project: projectSchema,
  }),
});

export const projectTasksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    tasks: z.array(projectTaskSchema),
  }),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectTask = z.infer<typeof projectTaskSchema>;
export type ProjectViewerRole = "owner" | "admin" | "contributor";

/**
 * Distinguish the owner from ADMIN members by user id.
 * @param project - A project read from the API.
 * @param viewerId - The current profile id, if available.
 * @returns The viewer role, or null until the profile is available.
 */
export function getProjectViewerRole(
  project: Project,
  viewerId: string | undefined,
): ProjectViewerRole | null {
  if (viewerId === undefined) return null;
  if (viewerId === project.owner.id) return "owner";
  return project.userRole === "ADMIN" ? "admin" : "contributor";
}

export class ProjectRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Project request failed (${status})`);
    this.name = "ProjectRequestError";
    this.status = status;
  }
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch("/projects", { signal });
      if (!response.ok) throw new ProjectRequestError(response.status);
      const body: unknown = await response.json();
      return projectsResponseSchema.parse(body).data.projects;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch(
        `/projects/${encodeURIComponent(id)}`,
        { signal },
      );
      if (!response.ok) throw new ProjectRequestError(response.status);
      const body: unknown = await response.json();
      return projectResponseSchema.parse(body).data.project;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useProjectTasksQuery(id: string) {
  return useQuery({
    queryKey: ["projects", id, "tasks"],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch(
        `/projects/${encodeURIComponent(id)}/tasks`,
        { signal },
      );
      if (!response.ok) throw new ProjectRequestError(response.status);
      const body: unknown = await response.json();
      return projectTasksResponseSchema.parse(body).data.tasks;
    },
    staleTime: 60_000,
    retry: false,
  });
}
