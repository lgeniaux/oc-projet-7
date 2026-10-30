import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { sortTasksByPriority } from "@/modules/tasks/sort-tasks-by-priority";

/** A calendar month. `month` goes from 1 (January) to 12 (December). */
export type CalendarMonth = { year: number; month: number };

/** Kanban columns in display order. Cancelled tasks have no column. */
export const kanbanStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

export type KanbanStatus = (typeof kanbanStatuses)[number];

/**
 * Give the month of a date in the browser time zone.
 * @param date - Usually the current date.
 * @returns The month that the user sees in the calendar.
 */
export function getCalendarMonth(date: Date): CalendarMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/**
 * Move a month forward or backward, across years when necessary.
 * @param offset - Number of months to add. Use a negative value to go back.
 */
export function shiftCalendarMonth(
  { year, month }: CalendarMonth,
  offset: number,
): CalendarMonth {
  const firstDay = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: firstDay.getUTCFullYear(), month: firstDay.getUTCMonth() + 1 };
}

/** Format a month in French, for example « octobre 2026 ». */
export function formatCalendarMonth({ year, month }: CalendarMonth): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * Group the tasks due in a month by Kanban column.
 * The due day is the calendar day sent by the API, as in `formatFrenchCalendarDate`.
 * Tasks without a due date and cancelled tasks are left out.
 * @returns Each column in priority order, then due date order. The cache is not changed.
 */
export function getMonthKanbanColumns(
  tasks: AssignedTask[],
  { year, month }: CalendarMonth,
): Record<KanbanStatus, AssignedTask[]> {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthTasks = sortTasksByPriority(
    tasks.filter((task) => task.dueDate?.startsWith(monthPrefix)),
  );

  return {
    TODO: monthTasks.filter(({ status }) => status === "TODO"),
    IN_PROGRESS: monthTasks.filter(({ status }) => status === "IN_PROGRESS"),
    DONE: monthTasks.filter(({ status }) => status === "DONE"),
  };
}
