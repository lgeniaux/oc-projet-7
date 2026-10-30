import { sortTasksByPriority } from "@/modules/tasks/sort-tasks-by-priority";

type AssignedTaskSummary = {
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: string | null;
};

/** Keep open tasks in business priority order without changing the query cache. */
export function getOpenAssignedTasks<T extends AssignedTaskSummary>(
  tasks: T[],
): T[] {
  return sortTasksByPriority(
    tasks.filter(({ status }) => status !== "DONE" && status !== "CANCELLED"),
  );
}
