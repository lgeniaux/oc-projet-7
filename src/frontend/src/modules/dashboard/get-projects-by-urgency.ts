import { getOpenAssignedTasks } from "@/modules/dashboard/get-open-assigned-tasks";
import type { ProjectWithAssignedTasks } from "@/modules/dashboard/projects-with-tasks-query";
import { compareTasksByPriority } from "@/modules/tasks/sort-tasks-by-priority";

export type ProjectByUrgency = {
  project: ProjectWithAssignedTasks;
  /** Open assigned tasks, the most urgent first. */
  openTasks: ProjectWithAssignedTasks["tasks"];
};

/**
 * Order the projects by their most urgent open assigned task.
 * Projects without an open task come last. Ties keep the API order (by name).
 * @returns A new array. The query cache is not changed.
 */
export function getProjectsByUrgency(
  projects: ProjectWithAssignedTasks[],
): ProjectByUrgency[] {
  return projects
    .map((project) => ({
      project,
      openTasks: getOpenAssignedTasks(project.tasks),
    }))
    .toSorted((first, second) => {
      const [firstTask] = first.openTasks;
      const [secondTask] = second.openTasks;
      if (!firstTask && !secondTask) return 0;
      if (!firstTask) return 1;
      if (!secondTask) return -1;
      return compareTasksByPriority(firstTask, secondTask);
    });
}
