import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { ProjectDetails } from "@/modules/projects/project-details";
import { ProjectList } from "@/modules/projects/project-list";
import type { Project, ProjectTask } from "@/modules/projects/project-query";

const apiFetch = vi.fn<typeof fetch>();
const alice = {
  id: "alice",
  name: "Alice Martin",
  email: "alice@example.com",
};
const bob = { id: "bob", name: null, email: "bob@example.com" };
const charlie = {
  id: "charlie",
  name: "Charlie Dupont",
  email: "charlie@example.com",
};
const ownedProject = {
  id: "owned-project",
  name: "Site vitrine",
  description: "Préparer le nouveau site.",
  owner: alice,
  members: [
    { role: "CONTRIBUTOR", user: bob },
    { role: "ADMIN", user: charlie },
  ],
  _count: { tasks: 3 },
  userRole: "ADMIN",
} satisfies Project;
const sharedProject: Project = {
  id: "shared-project",
  name: "Application mobile",
  description: null,
  owner: bob,
  members: [{ role: "CONTRIBUTOR", user: alice }],
  _count: { tasks: 1 },
  userRole: "CONTRIBUTOR",
};

function profileResponse() {
  return Response.json({ success: true, data: { user: alice } });
}

function projectsResponse(projects: Project[]) {
  return Response.json({ success: true, data: { projects } });
}

type TaskFixture = Pick<ProjectTask, "id" | "status"> & Partial<ProjectTask>;

function tasksResponse(tasks: TaskFixture[]) {
  return Response.json({
    success: true,
    data: {
      tasks: tasks.map((task) => ({
        title: "Task",
        description: null,
        priority: "MEDIUM",
        dueDate: null,
        assignees: [],
        comments: [],
        ...task,
      })),
    },
  });
}

function mockListRequests(
  projects: Project[],
  tasksByProject: Record<string, TaskFixture[]> = {},
) {
  apiFetch.mockImplementation(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/auth/profile") return profileResponse();
    if (path === "/projects") return projectsResponse(projects);
    for (const project of projects) {
      if (path === `/projects/${project.id}/tasks`) {
        return tasksResponse(tasksByProject[project.id] ?? []);
      }
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

function renderList() {
  render(
    <AppQueryProvider>
      <ProjectList />
    </AppQueryProvider>,
  );
}

function renderDetails() {
  render(
    <AppQueryProvider>
      <ProjectDetails projectId={ownedProject.id} />
    </AppQueryProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("authToken", "projects-token");
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

describe("project list", () => {
  it("keeps ownership when the profile email changes while projects remain cached", async () => {
    apiFetch.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/auth/profile") {
        return Response.json({
          success: true,
          data: { user: { ...alice, email: "updated@example.com" } },
        });
      }
      if (path === "/projects") return projectsResponse([ownedProject]);
      return tasksResponse([]);
    });
    renderList();

    const card = await screen.findByRole("link", { name: ownedProject.name });
    expect(await within(card).findByText(/^Votre rôle/)).toHaveTextContent(
      "Votre rôle : Propriétaire",
    );
  });

  it("announces loading without inventing cards or an empty state", async () => {
    let resolveProjects!: (response: Response) => void;
    apiFetch.mockImplementation(async (input) => {
      if (new URL(String(input)).pathname === "/auth/profile") {
        return profileResponse();
      }
      return new Promise<Response>((resolve) => {
        resolveProjects = resolve;
      });
    });
    renderList();

    expect(screen.getByRole("status")).toHaveTextContent(
      /chargement.*projets/i,
    );
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText(/pas encore de projet/i)).not.toBeInTheDocument();
    await act(async () => {
      resolveProjects(projectsResponse([]));
    });
    expect(await screen.findByText(/pas encore de projet/i)).toBeVisible();
  });

  it("explains an empty list and offers project creation", async () => {
    mockListRequests([]);
    renderList();

    expect(await screen.findByText(/pas encore de projet/i)).toBeVisible();
    expect(screen.getByText(/créerez/i)).toHaveTextContent(/contributeur/i);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Créer un projet" }),
    ).toBeVisible();
  });

  it("reports a failed list and retries without losing the tab session", async () => {
    const user = userEvent.setup();
    let listRequests = 0;
    apiFetch.mockImplementation(async (input) => {
      if (new URL(String(input)).pathname === "/auth/profile") {
        return profileResponse();
      }
      listRequests += 1;
      return listRequests === 1
        ? new Response(null, { status: 500 })
        : projectsResponse([]);
    });
    renderList();

    expect(await screen.findByRole("alert")).toHaveTextContent(/projets/i);
    expect(screen.queryByText(/pas encore de projet/i)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("authToken")).toBe("projects-token");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText(/pas encore de projet/i)).toBeVisible();
    expect(listRequests).toBe(2);
  });

  it("rejects a malformed success response instead of showing a false empty list", async () => {
    apiFetch.mockImplementation(async (input) => {
      if (new URL(String(input)).pathname === "/auth/profile") {
        return profileResponse();
      }
      return Response.json({ success: true, data: { projects: [{}] } });
    });
    renderList();

    expect(await screen.findByRole("alert")).toHaveTextContent(/projets/i);
    expect(screen.queryByText(/pas encore de projet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("links whole cards and shows real roles, team names and task-based progress", async () => {
    mockListRequests([ownedProject, sharedProject], {
      [ownedProject.id]: [
        { id: "done", status: "DONE" },
        { id: "active", status: "IN_PROGRESS" },
        { id: "cancelled", status: "CANCELLED" },
      ],
      [sharedProject.id]: [{ id: "cancelled-only", status: "CANCELLED" }],
    });
    renderList();

    const ownedCard = await screen.findByRole("link", {
      name: ownedProject.name,
    });
    const sharedCard = screen.getByRole("link", {
      name: sharedProject.name,
    });
    expect(ownedCard).toHaveAttribute("href", `/projects/${ownedProject.id}`);
    expect(sharedCard).toHaveAttribute("href", `/projects/${sharedProject.id}`);
    expect(
      within(ownedCard).getByRole("heading", {
        level: 2,
        name: ownedProject.name,
      }),
    ).toBeVisible();
    expect(within(ownedCard).getByText(ownedProject.description)).toBeVisible();
    expect(
      await within(sharedCard).findByText("Contributeur", { exact: true }),
    ).toBeVisible();
    expect(within(ownedCard).getByText(/^Votre rôle/)).toHaveTextContent(
      "Votre rôle : Propriétaire",
    );
    expect(within(ownedCard).getByText("Équipe (3)")).toBeVisible();
    expect(within(sharedCard).getByText("Équipe (2)")).toBeVisible();
    expect(
      within(ownedCard).getByRole("img", {
        name: "Alice Martin, Propriétaire",
      }),
    ).toBeInTheDocument();
    expect(
      within(ownedCard).getByRole("img", {
        name: "bob@example.com, Contributeur",
      }),
    ).toBeInTheDocument();
    expect(
      within(ownedCard).getByRole("img", {
        name: "Charlie Dupont, Administrateur",
      }),
    ).toBeInTheDocument();
    expect(within(ownedCard).queryByRole("button")).not.toBeInTheDocument();
    expect(within(ownedCard).queryByRole("link")).not.toBeInTheDocument();

    const progress = await within(ownedCard).findByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "50");
    expect(within(ownedCard).getByText(/^50\s*%$/)).toBeVisible();
    expect(within(ownedCard).getByText("1/2 tâches terminées")).toBeVisible();
    expect(await within(sharedCard).findByText("Aucune tâche")).toBeVisible();
    expect(within(sharedCard).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    for (const [, options] of apiFetch.mock.calls) {
      expect((options?.headers as Headers).get("Authorization")).toBe(
        "Bearer projects-token",
      );
      expect(options?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("keeps the card usable while its task-based progress is loading", async () => {
    let resolveTasks!: (response: Response) => void;
    apiFetch.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/auth/profile") return profileResponse();
      if (path === "/projects") return projectsResponse([ownedProject]);
      return new Promise<Response>((resolve) => {
        resolveTasks = resolve;
      });
    });
    renderList();

    const card = await screen.findByRole("link", { name: ownedProject.name });
    expect(within(card).getByRole("status")).toHaveTextContent(
      "Chargement de la progression…",
    );
    expect(card).toHaveAttribute("href", `/projects/${ownedProject.id}`);
    expect(within(card).getByText(ownedProject.description)).toBeVisible();
    expect(within(card).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(card).queryByText(/0\s*%/)).not.toBeInTheDocument();
    await act(async () => {
      resolveTasks(tasksResponse([{ id: "done", status: "DONE" }]));
    });
    expect(await within(card).findByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("keeps a card and its team when only its progress request fails", async () => {
    apiFetch.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/auth/profile") return profileResponse();
      if (path === "/projects") {
        return projectsResponse([ownedProject, sharedProject]);
      }
      if (path === `/projects/${ownedProject.id}/tasks`) {
        return new Response(null, { status: 500 });
      }
      return tasksResponse([]);
    });
    renderList();

    const ownedCard = await screen.findByRole("link", {
      name: ownedProject.name,
    });
    expect(
      await within(ownedCard).findByText("La progression est indisponible."),
    ).toHaveAttribute("role", "status");
    expect(within(ownedCard).getByText(ownedProject.description)).toBeVisible();
    expect(
      within(ownedCard).getByRole("img", {
        name: "Alice Martin, Propriétaire",
      }),
    ).toBeInTheDocument();
    expect(
      within(ownedCard).queryByRole("progressbar"),
    ).not.toBeInTheDocument();
    expect(within(ownedCard).queryByText(/0\s*%/)).not.toBeInTheDocument();
    const sharedCard = screen.getByRole("link", { name: sharedProject.name });
    expect(await within(sharedCard).findByText("Aucune tâche")).toBeVisible();
  });
});

describe("project details", () => {
  it("announces loading then displays the real project name and description", async () => {
    let resolveProject!: (response: Response) => void;
    apiFetch.mockResolvedValue(tasksResponse([]));
    apiFetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveProject = resolve;
        }),
    );
    renderDetails();

    expect(screen.getByRole("status")).toHaveTextContent(/chargement/i);
    expect(screen.queryByText(ownedProject.name)).not.toBeInTheDocument();
    await act(async () => {
      resolveProject(
        Response.json({ success: true, data: { project: ownedProject } }),
      );
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: ownedProject.name }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(ownedProject.description)).toBeVisible();
    expect(
      await screen.findByText("Aucune tâche pour ce projet."),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /créer|modifier|supprimer/i }),
    ).not.toBeInTheDocument();
  });

  it.each([403, 404])(
    "shows an honest inaccessible state for HTTP %i",
    async (status) => {
      apiFetch.mockResolvedValueOnce(
        Response.json(
          { success: false, error: "Raw backend error" },
          { status },
        ),
      );
      renderDetails();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Ce projet n'existe pas ou vous n'y avez pas accès.",
      );
      expect(
        screen.getByRole("heading", { level: 1, name: "Projet inaccessible" }),
      ).toBeVisible();
      expect(screen.queryByText(ownedProject.name)).not.toBeInTheDocument();
      expect(screen.queryByText(/Raw backend/)).not.toBeInTheDocument();
      expect(sessionStorage.getItem("authToken")).toBe("projects-token");
    },
  );

  it("retries a server failure and supports a project without a description", async () => {
    const user = userEvent.setup();
    apiFetch.mockResolvedValue(tasksResponse([]));
    apiFetch
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          data: { project: { ...ownedProject, description: null } },
        }),
      );
    renderDetails();

    expect(await screen.findByRole("alert")).toHaveTextContent(/projet/i);
    expect(screen.queryByText(ownedProject.name)).not.toBeInTheDocument();
    expect(
      screen.queryByText(ownedProject.description),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Ce projet n'existe pas ou vous n'y avez pas accès."),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem("authToken")).toBe("projects-token");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: ownedProject.name }),
    ).toBeVisible();
    expect(screen.getByText("Aucune description.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
