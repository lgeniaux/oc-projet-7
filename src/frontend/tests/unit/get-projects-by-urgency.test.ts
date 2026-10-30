import { describe, expect, it } from "vitest";
import { getProjectsByUrgency } from "@/modules/dashboard/get-projects-by-urgency";
import type { ProjectWithAssignedTasks } from "@/modules/dashboard/projects-with-tasks-query";

type Task = ProjectWithAssignedTasks["tasks"][number];

function task(
  id: string,
  priority: Task["priority"],
  dueDate: string | null,
  status: Task["status"] = "TODO",
): Task {
  return { id, title: id, status, priority, dueDate };
}

function project(id: string, tasks: Task[]): ProjectWithAssignedTasks {
  return { id, name: id, description: null, tasks };
}

describe("getProjectsByUrgency", () => {
  it("orders projects by their most urgent open task, closed-only projects last, without changing the cache", () => {
    const projects = [
      project("closed-only", [
        task("done", "URGENT", "2026-01-01T00:00:00.000Z", "DONE"),
        task("cancelled", "URGENT", null, "CANCELLED"),
      ]),
      project("medium", [task("medium-task", "MEDIUM", null)]),
      project("high-later", [
        task("high-later-task", "HIGH", "2026-05-01T00:00:00.000Z"),
      ]),
      project("high-sooner", [
        task("low-task", "LOW", "2026-01-01T00:00:00.000Z"),
        task("high-sooner-task", "HIGH", "2026-04-01T00:00:00.000Z"),
        task("finished-urgent", "URGENT", null, "DONE"),
      ]),
      project("medium-tie", [task("medium-tie-task", "MEDIUM", null)]),
    ];
    const originalTasks = projects.map(({ tasks }) =>
      tasks.map(({ id }) => id),
    );

    const ordered = getProjectsByUrgency(projects);

    expect(ordered.map(({ project }) => project.id)).toEqual([
      "high-sooner",
      "high-later",
      "medium",
      "medium-tie",
      "closed-only",
    ]);
    expect(ordered[0].openTasks.map(({ id }) => id)).toEqual([
      "high-sooner-task",
      "low-task",
    ]);
    expect(ordered.at(-1)?.openTasks).toEqual([]);
    expect(projects.map(({ tasks }) => tasks.map(({ id }) => id))).toEqual(
      originalTasks,
    );
  });
});
