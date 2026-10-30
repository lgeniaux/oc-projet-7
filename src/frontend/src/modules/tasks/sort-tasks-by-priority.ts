type PrioritizedTask = {
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: string | null;
};

const priorityRank = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * Compare two tasks by business priority, then by due date (no date last).
 * @returns A negative number when `first` is more urgent; 0 for a tie.
 */
export function compareTasksByPriority(
  first: PrioritizedTask,
  second: PrioritizedTask,
): number {
  const priority = priorityRank[first.priority] - priorityRank[second.priority];
  if (priority !== 0) return priority;
  if (first.dueDate === second.dueDate) return 0;
  if (first.dueDate === null) return 1;
  if (second.dueDate === null) return -1;
  return Date.parse(first.dueDate) - Date.parse(second.dueDate);
}

/** Sort a copy, keeping the shared query cache in its original order. */
export function sortTasksByPriority<T extends PrioritizedTask>(
  tasks: T[],
): T[] {
  return tasks.toSorted(compareTasksByPriority);
}
