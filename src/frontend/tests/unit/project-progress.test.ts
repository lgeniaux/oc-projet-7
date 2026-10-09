import { describe, expect, it } from "vitest";
import { getProjectProgress } from "@/modules/projects/project-progress";

describe("getProjectProgress", () => {
  it("counts only DONE tasks as completed", () => {
    expect(
      getProjectProgress([
        { status: "TODO" },
        { status: "IN_PROGRESS" },
        { status: "DONE" },
        { status: "DONE" },
      ]),
    ).toEqual({ done: 2, total: 4, percentage: 50 });
  });

  it("excludes cancelled tasks from the total", () => {
    expect(
      getProjectProgress([{ status: "DONE" }, { status: "CANCELLED" }]),
    ).toEqual({ done: 1, total: 1, percentage: 100 });
  });

  it("returns zero progress for an empty project", () => {
    expect(getProjectProgress([])).toEqual({
      done: 0,
      total: 0,
      percentage: 0,
    });
  });

  it("returns zero progress when all tasks are cancelled", () => {
    expect(
      getProjectProgress([{ status: "CANCELLED" }, { status: "CANCELLED" }]),
    ).toEqual({ done: 0, total: 0, percentage: 0 });
  });

  it.each([
    { completed: 1, percentage: 33 },
    { completed: 2, percentage: 67 },
  ])(
    "rounds $completed of three completed tasks to $percentage%",
    (testCase) => {
      const statuses = ["DONE", "DONE", "TODO"] as const;
      const tasks = statuses.map((status, index) => ({
        status: index < testCase.completed ? status : "TODO",
      }));

      expect(getProjectProgress(tasks)).toEqual({
        done: testCase.completed,
        total: 3,
        percentage: testCase.percentage,
      });
    },
  );
});
