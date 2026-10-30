"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";

// Express returns only the tasks assigned to the authenticated user.
const assignedProjectTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.iso.datetime({ offset: true }).nullable(),
});

const projectWithAssignedTasksSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  tasks: z.array(assignedProjectTaskSchema),
});

const projectsWithTasksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ projects: z.array(projectWithAssignedTasksSchema) }),
});

export type ProjectWithAssignedTasks = z.infer<
  typeof projectWithAssignedTasksSchema
>;

export function useProjectsWithTasksQuery() {
  return useQuery({
    queryKey: ["dashboard", "projects-with-tasks"],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch(
        "/dashboard/projects-with-tasks",
        { signal },
      );
      if (!response.ok) throw new Error("Dashboard projects unavailable");
      const body: unknown = await response.json();
      return projectsWithTasksResponseSchema.parse(body).data.projects;
    },
    staleTime: 60_000,
    retry: false,
  });
}
