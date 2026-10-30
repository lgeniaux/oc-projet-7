import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import {
  getCalendarMonth,
  getMonthKanbanColumns,
  shiftCalendarMonth,
} from "@/modules/dashboard/month-kanban";

function task(
  id: string,
  status: AssignedTask["status"],
  dueDate: string | null,
  priority: AssignedTask["priority"] = "MEDIUM",
): AssignedTask {
  return {
    id,
    title: id,
    description: null,
    status,
    priority,
    dueDate,
    project: { id: "project", name: "Projet" },
    comments: [],
  };
}

function ids(tasks: AssignedTask[]) {
  return tasks.map(({ id }) => id);
}

describe("getMonthKanbanColumns", () => {
  it("keeps the API calendar days of the month, by status then priority, without changing the cache", () => {
    const tasks = [
      task("previous-month", "TODO", "2026-02-28T00:00:00.000Z"),
      task("first-day", "TODO", "2026-03-01T00:00:00.000Z", "LOW"),
      task("last-day", "TODO", "2026-03-31T00:00:00.000Z", "URGENT"),
      task("next-month", "TODO", "2026-04-01T00:00:00.000Z"),
      task("previous-year", "TODO", "2025-03-15T00:00:00.000Z"),
      task("undated", "TODO", null),
      task("cancelled", "CANCELLED", "2026-03-10T00:00:00.000Z"),
      task("in-progress", "IN_PROGRESS", "2026-03-10T00:00:00.000Z"),
      task("done", "DONE", "2026-03-20T00:00:00.000Z"),
    ];
    const originalOrder = ids(tasks);

    const columns = getMonthKanbanColumns(tasks, { year: 2026, month: 3 });

    expect(ids(columns.TODO)).toEqual(["last-day", "first-day"]);
    expect(ids(columns.IN_PROGRESS)).toEqual(["in-progress"]);
    expect(ids(columns.DONE)).toEqual(["done"]);
    expect(ids(tasks)).toEqual(originalOrder);
  });

  it("does not confuse January with October to December", () => {
    const tasks = [
      task("january", "TODO", "2026-01-05T00:00:00.000Z"),
      task("october", "TODO", "2026-10-05T00:00:00.000Z"),
    ];

    expect(
      ids(getMonthKanbanColumns(tasks, { year: 2026, month: 1 }).TODO),
    ).toEqual(["january"]);
  });
});

describe("shiftCalendarMonth", () => {
  it.each([
    [{ year: 2026, month: 12 }, 1, { year: 2027, month: 1 }],
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
    [{ year: 2026, month: 10 }, 1, { year: 2026, month: 11 }],
  ])("moves %o by %i month", (month, offset, expected) => {
    expect(shiftCalendarMonth(month, offset)).toEqual(expected);
  });
});

describe("getCalendarMonth", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["Pacific/Kiritimati", { year: 2026, month: 11 }],
    ["America/Los_Angeles", { year: 2026, month: 10 }],
  ])("uses the month that the user sees in %s", (timeZone, expected) => {
    vi.stubEnv("TZ", timeZone);
    // 31 October at 23:30 UTC is already 1 November in Kiritimati (UTC+14).
    expect(getCalendarMonth(new Date("2026-10-31T23:30:00.000Z"))).toEqual(
      expected,
    );
  });
});
