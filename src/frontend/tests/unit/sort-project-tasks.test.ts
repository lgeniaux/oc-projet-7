import { describe, expect, it } from "vitest";
import type { ProjectTask } from "@/modules/projects/project-query";
import { sortProjectTasks } from "@/modules/projects/sort-project-tasks";

function task(
  id: string,
  priority: ProjectTask["priority"],
  dueDate: string | null,
): ProjectTask {
  return {
    id,
    title: id,
    description: null,
    status: "TODO",
    priority,
    dueDate,
    assignees: [],
    comments: [],
  };
}

describe("sortProjectTasks", () => {
  it("orders business priorities before dates, puts missing dates last and leaves the cache unchanged", () => {
    const tasks = [
      task("low", "LOW", "2024-01-01T00:00:00.000Z"),
      task("medium", "MEDIUM", null),
      task("high-undated", "HIGH", null),
      task("high-later", "HIGH", "2026-03-10T00:00:00.000Z"),
      task("urgent", "URGENT", null),
      task("high-earlier", "HIGH", "2026-03-09T00:00:00.000Z"),
    ];
    const originalOrder = tasks.map(({ id }) => id);
    expect(sortProjectTasks(tasks).map(({ id }) => id)).toEqual([
      "urgent",
      "high-earlier",
      "high-later",
      "high-undated",
      "medium",
      "low",
    ]);
    expect(tasks.map(({ id }) => id)).toEqual(originalOrder);
  });

  it("preserves the server order for equal priority and deadline", () => {
    const tasks = [task("first", "HIGH", null), task("second", "HIGH", null)];
    expect(sortProjectTasks(tasks).map(({ id }) => id)).toEqual([
      "first",
      "second",
    ]);
    expect(sortProjectTasks([])).toEqual([]);
  });
});
