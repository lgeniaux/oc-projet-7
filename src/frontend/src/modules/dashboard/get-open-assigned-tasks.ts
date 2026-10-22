import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { sortTasksByPriority } from "@/modules/tasks/sort-tasks-by-priority";

/** Keep open tasks in business priority order without changing the query cache. */
export function getOpenAssignedTasks(tasks: AssignedTask[]): AssignedTask[] {
  return sortTasksByPriority(
    tasks.filter(({ status }) => status !== "DONE" && status !== "CANCELLED"),
  );
}
