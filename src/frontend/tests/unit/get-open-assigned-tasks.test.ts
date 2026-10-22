import { describe, expect, it } from "vitest";
import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { getOpenAssignedTasks } from "@/modules/dashboard/get-open-assigned-tasks";

function task(
  id: string,
  priority: AssignedTask["priority"],
  dueDate: string | null,
  status: AssignedTask["status"] = "TODO",
): AssignedTask {
  return {
    id,
    title: id,
    description: null,
    priority,
    dueDate,
    status,
    project: { id: "project", name: "Projet" },
    comments: [],
  };
}

describe("getOpenAssignedTasks", () => {
  it("hides closed tasks and orders open tasks by business priority then deadline without changing the cache", () => {
    const tasks = [
      task("low", "LOW", "2024-01-01T00:00:00Z"),
      task("done", "URGENT", null, "DONE"),
      task("medium", "MEDIUM", null),
      task("high-undated", "HIGH", null),
      task("high-later", "HIGH", "2026-03-10T00:00:00Z"),
      task("cancelled", "URGENT", null, "CANCELLED"),
      task("urgent", "URGENT", null, "IN_PROGRESS"),
      task("high-first", "HIGH", "2026-03-09T00:00:00Z"),
      task("high-tie", "HIGH", "2026-03-09T00:00:00Z"),
    ];
    const originalOrder = tasks.map(({ id }) => id);
    expect(getOpenAssignedTasks(tasks).map(({ id }) => id)).toEqual([
      "urgent",
      "high-first",
      "high-tie",
      "high-later",
      "high-undated",
      "medium",
      "low",
    ]);
    expect(tasks.map(({ id }) => id)).toEqual(originalOrder);
  });
});
