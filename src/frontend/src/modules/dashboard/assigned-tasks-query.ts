"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";

const assignedTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.iso.datetime({ offset: true }).nullable(),
  project: z.object({ id: z.string(), name: z.string() }),
  comments: z.array(z.object({ id: z.string() })),
});

const assignedTasksResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ tasks: z.array(assignedTaskSchema) }),
});

export type AssignedTask = z.infer<typeof assignedTaskSchema>;

export function useAssignedTasksQuery() {
  return useQuery({
    queryKey: ["dashboard", "assigned-tasks"],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch("/dashboard/assigned-tasks", {
        signal,
      });
      if (!response.ok) throw new Error("Assigned tasks unavailable");
      const body: unknown = await response.json();
      return assignedTasksResponseSchema.parse(body).data.tasks;
    },
    staleTime: 60_000,
    retry: false,
  });
}
