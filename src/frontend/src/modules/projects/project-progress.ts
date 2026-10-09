import type { ProjectTask } from "@/modules/projects/project-query";

/**
 * Calculate completed tasks as a share of tasks that are not cancelled.
 * @param tasks - Project tasks with their backend status.
 * @returns Counts and a rounded percentage. An empty total gives zero percent.
 */
export function getProjectProgress(
  tasks: readonly Pick<ProjectTask, "status">[],
): { done: number; total: number; percentage: number } {
  let done = 0;
  let total = 0;

  for (const task of tasks) {
    if (task.status === "CANCELLED") continue;
    total += 1;
    if (task.status === "DONE") done += 1;
  }

  return {
    done,
    total,
    percentage: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
