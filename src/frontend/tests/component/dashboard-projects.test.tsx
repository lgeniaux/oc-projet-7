import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { DashboardProjects } from "@/modules/dashboard/dashboard-projects";
import type { ProjectWithAssignedTasks } from "@/modules/dashboard/projects-with-tasks-query";

const apiFetch = vi.fn<typeof fetch>();

const website = {
  id: "site",
  name: "Site vitrine",
  description: "Refonte du site.",
  tasks: [
    {
      id: "maquette",
      title: "Valider la maquette",
      status: "DONE",
      priority: "URGENT",
      dueDate: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "contenus",
      title: "Rédiger les contenus",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: "2026-03-09T00:00:00.000Z",
    },
    {
      id: "relecture",
      title: "Relire les pages",
      status: "TODO",
      priority: "LOW",
      dueDate: null,
    },
  ],
} satisfies ProjectWithAssignedTasks;

const archive = {
  id: "archive",
  name: "Archives",
  description: null,
  tasks: [
    {
      id: "classement",
      title: "Classer les factures",
      status: "DONE",
      priority: "MEDIUM",
      dueDate: null,
    },
  ],
} satisfies ProjectWithAssignedTasks;

function projectsResponse(projects: ProjectWithAssignedTasks[]) {
  return Response.json({ success: true, data: { projects } });
}

function renderProjects() {
  render(
    <AppQueryProvider>
      <DashboardProjects />
    </AppQueryProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("authToken", "dashboard-projects-token");
  vi.stubGlobal("fetch", apiFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("dashboard projects", () => {
  it("lists the most urgent project first with its next assigned task and a link", async () => {
    // Express orders by name: « Archives » comes first in the response.
    apiFetch.mockResolvedValue(projectsResponse([archive, website]));
    renderProjects();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement de vos projets…",
    );
    const list = await screen.findByRole("list", {
      name: "Projets avec des tâches assignées",
    });
    expect(
      within(list)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Site vitrine", "Archives"]);

    const [websiteCard, archiveCard] = within(list).getAllByRole("listitem");
    const card = within(websiteCard);
    expect(card.getByText("Tâches ouvertes").nextSibling).toHaveTextContent(
      "2",
    );
    expect(card.getByText("Prochaine tâche").nextSibling).toHaveTextContent(
      "Rédiger les contenusEn cours",
    );
    expect(card.getByText("Priorité").nextSibling).toHaveTextContent("Haute");
    expect(card.getByText("9 mars 2026")).toHaveAttribute(
      "datetime",
      "2026-03-09",
    );
    expect(card.getByText("1/3 tâches terminées")).toBeVisible();
    expect(
      card.getByRole("progressbar", {
        name: "Mes tâches terminées dans Site vitrine",
      }),
    ).toHaveAttribute("aria-valuenow", "33");
    expect(
      card.getByRole("link", { name: "Voir le projet « Site vitrine »" }),
    ).toHaveAttribute("href", "/projects/site");

    expect(
      within(archiveCard).getByText(
        "Aucune tâche à faire ou en cours ne vous est assignée dans ce projet.",
      ),
    ).toBeVisible();
    expect(within(archiveCard).getByText("Aucune description.")).toBeVisible();

    const [url, options] = apiFetch.mock.calls[0];
    expect(String(url)).toBe(
      "http://localhost:8000/dashboard/projects-with-tasks",
    );
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer dashboard-projects-token",
    );
  });

  it("announces when no project has an assigned task", async () => {
    apiFetch.mockResolvedValue(projectsResponse([]));
    renderProjects();

    expect(
      await screen.findByText(
        "Aucun projet ne contient de tâche qui vous est assignée.",
      ),
    ).toHaveAttribute("role", "status");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it.each(["server", "invalid"])(
    "announces a %s response as an error and retries on request",
    async (failure) => {
      const user = userEvent.setup();
      apiFetch
        .mockResolvedValueOnce(
          failure === "server"
            ? new Response(null, { status: 500 })
            : Response.json({ success: true, data: { projects: [{}] } }),
        )
        .mockResolvedValueOnce(projectsResponse([website]));
      renderProjects();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Vos projets sont indisponibles pour le moment. Réessayez.",
      );
      await user.click(screen.getByRole("button", { name: "Réessayer" }));
      expect(
        await screen.findByRole("heading", { level: 3, name: "Site vitrine" }),
      ).toBeVisible();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(apiFetch).toHaveBeenCalledTimes(2);
    },
  );
});
