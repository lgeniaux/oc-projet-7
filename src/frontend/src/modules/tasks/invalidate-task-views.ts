import type { QueryClient } from "@tanstack/react-query";

/**
 * Refresh every view that shows the tasks of a project after a task write.
 * @param queryClient - The application query client.
 * @param projectId - The project that owns the changed task.
 * @returns A promise that ends when the active views are refetched.
 */
export async function invalidateTaskViews(
  queryClient: QueryClient,
  projectId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["projects", projectId, "tasks"],
    }),
    // The project list counts the tasks of each project.
    queryClient.invalidateQueries({ queryKey: ["projects"], exact: true }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}
