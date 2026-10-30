import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { DashboardViews } from "@/modules/dashboard/dashboard-views";

const apiFetch = vi.fn<typeof fetch>();

function task(
  id: string,
  status: AssignedTask["status"],
  dueDate: string | null,
): AssignedTask {
  return {
    id,
    title: `Tâche ${id}`,
    description: null,
    status,
    priority: "MEDIUM",
    dueDate,
    project: { id: "site", name: "Site vitrine" },
    comments: [],
  };
}

function column(name: string) {
  return screen.getByRole("region", { name });
}

function displayedMonth() {
  return screen.getByRole("group", { name: "Mois affiché" });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 15, 12));
  sessionStorage.setItem("authToken", "dashboard-kanban-token");
  vi.stubGlobal("fetch", apiFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("dashboard month Kanban", () => {
  it("shows the current month by status, moves between months and keeps the month after a tab change", async () => {
    const user = userEvent.setup();
    apiFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: {
          tasks: [
            task("mars-a", "TODO", "2026-03-02T00:00:00.000Z"),
            task("mars-b", "TODO", "2026-03-31T00:00:00.000Z"),
            task("mars-terminee", "DONE", "2026-03-10T00:00:00.000Z"),
            task("mars-annulee", "CANCELLED", "2026-03-10T00:00:00.000Z"),
            task("sans-echeance", "IN_PROGRESS", null),
            task("avril", "IN_PROGRESS", "2026-04-01T00:00:00.000Z"),
          ],
        },
      }),
    );
    render(
      <AppQueryProvider>
        <DashboardViews />
      </AppQueryProvider>,
    );

    await user.click(screen.getByRole("tab", { name: "Kanban" }));
    expect(screen.getByRole("tab", { name: "Kanban" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(displayedMonth()).getByText("mars 2026")).toBeVisible();
    const todo = await screen.findByRole("region", {
      name: "À faire 2 tâches",
    });
    expect(
      within(todo)
        .getAllByRole("heading", { level: 4 })
        .map((heading) => heading.textContent),
    ).toEqual(["Tâche mars-a", "Tâche mars-b"]);
    expect(
      within(column("En cours 0 tâche")).getByText("Aucune tâche ce mois-ci."),
    ).toBeVisible();
    expect(
      within(column("Terminées 1 tâche")).getByRole("heading", { level: 4 }),
    ).toHaveTextContent("Tâche mars-terminee");
    expect(screen.queryByText("Tâche mars-annulee")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mois suivant" }));
    expect(within(displayedMonth()).getByText("avril 2026")).toBeVisible();
    expect(
      within(column("En cours 1 tâche")).getByRole("heading", { level: 4 }),
    ).toHaveTextContent("Tâche avril");
    expect(column("À faire 0 tâche")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Liste" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Mes tâches assignées" }),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: /^À faire/ })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Kanban" }));
    expect(within(displayedMonth()).getByText("avril 2026")).toBeVisible();
    expect(apiFetch).toHaveBeenCalledOnce();
  });
});
