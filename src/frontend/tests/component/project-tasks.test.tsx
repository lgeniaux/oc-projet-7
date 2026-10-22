import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { ProjectDetails } from "@/modules/projects/project-details";
import type { Project, ProjectTask } from "@/modules/projects/project-query";

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const apiFetch = vi.fn<typeof fetch>();
const alice = {
  id: "alice",
  name: "Alice Martin",
  email: "alice@example.com",
};
const project = {
  id: "task-project",
  name: "Site vitrine",
  description: "Préparer le nouveau site.",
  owner: alice,
  members: [],
  _count: { tasks: 4 },
  userRole: "ADMIN",
} satisfies Project;

function task(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "database",
    title: "Conception de la base de données",
    description: "Définir les relations entre les tables.",
    status: "TODO",
    priority: "HIGH",
    dueDate: "2024-01-15T00:00:00.000Z",
    assignees: [],
    comments: [],
    ...overrides,
  };
}

function tasksResponse(tasks: ProjectTask[]) {
  return Response.json({ success: true, data: { tasks } });
}

function mockTaskRequests(respond: () => Response | Promise<Response>) {
  apiFetch.mockImplementation(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/auth/profile")
      return Response.json({ success: true, data: { user: alice } });
    if (path === `/projects/${project.id}`) {
      return Response.json({ success: true, data: { project } });
    }
    if (path === `/projects/${project.id}/tasks`) return respond();
    throw new Error(`Unexpected request: ${path}`);
  });
}

function QueryClientCapture({
  capture,
}: {
  capture: (client: QueryClient) => void;
}) {
  const client = useQueryClient();
  useEffect(() => capture(client), [capture, client]);
  return null;
}

function renderDetails(capture?: (client: QueryClient) => void) {
  render(
    <AppQueryProvider>
      {capture && <QueryClientCapture capture={capture} />}
      <ProjectDetails projectId={project.id} />
    </AppQueryProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("authToken", "project-tasks-token");
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

describe("project tasks", () => {
  it("loads tasks only after the project and keeps its details visible while waiting", async () => {
    let resolveProject!: (response: Response) => void;
    let resolveTasks!: (response: Response) => void;
    apiFetch.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/auth/profile")
        return Response.json({ success: true, data: { user: alice } });
      if (path === `/projects/${project.id}`) {
        return new Promise<Response>((resolve) => {
          resolveProject = resolve;
        });
      }
      if (path === `/projects/${project.id}/tasks`) {
        return new Promise<Response>((resolve) => {
          resolveTasks = resolve;
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderDetails();

    expect(screen.getByRole("status")).toHaveTextContent(/chargement.*projet/i);
    expect(
      apiFetch.mock.calls.filter(
        ([input]) => new URL(String(input)).pathname !== "/auth/profile",
      ),
    ).toHaveLength(1);
    await act(async () => {
      resolveProject(Response.json({ success: true, data: { project } }));
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: project.name }),
    ).toBeVisible();
    expect(screen.getByText(project.description)).toBeVisible();
    const section = screen.getByRole("region", { name: "Tâches" });
    expect(within(section).getByRole("status")).toHaveTextContent(
      /chargement.*tâches/i,
    );
    expect(
      within(section).queryByRole("heading", { level: 3 }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Aucune tâche pour ce projet."),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveTasks(tasksResponse([task()]));
    });
    expect(
      await within(section).findByRole("heading", {
        level: 3,
        name: task().title,
      }),
    ).toBeVisible();
    expect(within(section).queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains an empty task list without hiding the project", async () => {
    mockTaskRequests(() => tasksResponse([]));
    renderDetails();

    expect(
      await screen.findByText("Aucune tâche pour ce projet."),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: project.name }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Tâches" }),
    ).toHaveAttribute("id", "project-tasks-heading");
    expect(
      screen.getByText("Par ordre de priorité, puis d’échéance"),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("retries a task failure without losing the project or session", async () => {
    const user = userEvent.setup();
    let taskRequests = 0;
    mockTaskRequests(() => {
      taskRequests += 1;
      return taskRequests === 1
        ? new Response(null, { status: 500 })
        : tasksResponse([task()]);
    });
    renderDetails();

    expect(await screen.findByRole("alert")).toHaveTextContent(/tâches/i);
    expect(
      screen.getByRole("heading", { level: 1, name: project.name }),
    ).toBeVisible();
    expect(screen.getByText(project.description)).toBeVisible();
    expect(
      screen.queryByText("Aucune tâche pour ce projet."),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem("authToken")).toBe("project-tasks-token");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("heading", { level: 3, name: task().title }),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(taskRequests).toBe(2);
  });

  it.each([
    {
      label: "missing task fields",
      value: { id: "incomplete", status: "TODO" },
    },
    { label: "an unknown status", value: { ...task(), status: "ARCHIVED" } },
    {
      label: "an invalid due date",
      value: { ...task(), dueDate: "2024-01-15" },
    },
    {
      label: "a missing nested assignee",
      value: { ...task(), assignees: [{ id: "assignment" }] },
    },
    {
      label: "an invalid comment date",
      value: {
        ...task(),
        comments: [
          {
            id: "comment",
            content: "À relire.",
            createdAt: "yesterday",
            author: alice,
          },
        ],
      },
    },
  ])(
    "rejects $label instead of inventing an empty task list",
    async ({ value }) => {
      mockTaskRequests(() =>
        Response.json({ success: true, data: { tasks: [value] } }),
      );
      renderDetails();

      expect(await screen.findByRole("alert")).toHaveTextContent(/tâches/i);
      expect(
        screen.getByRole("heading", { level: 1, name: project.name }),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Réessayer" })).toBeVisible();
      expect(
        screen.queryByText("Aucune tâche pour ce projet."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 3 }),
      ).not.toBeInTheDocument();
    },
  );

  it("shows every status, visible assignee identities and API calendar dates", async () => {
    const tasks = [
      task({
        assignees: [
          { id: "assignment-alice", user: alice },
          {
            id: "assignment-bob",
            user: { id: "bob", name: null, email: "bob@example.com" },
          },
          {
            id: "assignment-charlie",
            user: { id: "charlie", email: "charlie@example.com" },
          },
        ],
      }),
      task({
        id: "api",
        title: "Développement API",
        status: "IN_PROGRESS",
        dueDate: "2024-02-01T23:30:00-05:00",
      }),
      task({
        id: "tests",
        title: "Tests automatisés",
        status: "DONE",
        dueDate: null,
      }),
      task({
        id: "cancelled",
        title: "Ancienne interface",
        description: null,
        status: "CANCELLED",
        dueDate: null,
      }),
    ];
    mockTaskRequests(() =>
      Response.json({
        success: true,
        extra: "ignored",
        data: {
          tasks: tasks.map((item) => ({ ...item, backendMetadata: "ignored" })),
        },
      }),
    );
    renderDetails();

    const list = await screen.findByRole("list", { name: "Tâches du projet" });
    expect(within(list).getByText("À faire", { exact: true })).toBeVisible();
    expect(within(list).getByText("En cours", { exact: true })).toBeVisible();
    expect(within(list).getByText("Terminée", { exact: true })).toBeVisible();
    expect(within(list).getByText("Annulée", { exact: true })).toBeVisible();
    const assignees = within(list).getByRole("list", {
      name: "Personnes assignées",
    });
    expect(
      within(assignees).getByText("Alice Martin", { exact: true }),
    ).toBeVisible();
    expect(
      within(assignees).getByText("bob@example.com", { exact: true }),
    ).toBeVisible();
    expect(
      within(assignees).getByText("charlie@example.com", { exact: true }),
    ).toBeVisible();
    expect(within(list).getAllByText("Non assignée")).toHaveLength(3);
    expect(
      within(list).getByText("15 janvier 2024", { exact: true }),
    ).toBeVisible();
    expect(
      within(list).getByText("1 février 2024", { exact: true }),
    ).toBeVisible();
    expect(within(list).getAllByText("Aucune échéance")).toHaveLength(2);
    expect(
      within(list).getAllByText("Définir les relations entre les tables."),
    ).toHaveLength(3);
    expect(within(list).getByText("Aucune description.")).toBeVisible();
  });

  it("orders priorities before due dates, puts null dates last and keeps API ties stable", async () => {
    const tasks = [
      task({
        id: "low",
        title: "Priorité basse",
        priority: "LOW",
        dueDate: "2023-01-01T00:00:00Z",
      }),
      task({ id: "high-none", title: "Haute sans échéance", dueDate: null }),
      task({ id: "medium", title: "Priorité moyenne", priority: "MEDIUM" }),
      task({
        id: "high-later",
        title: "Haute plus tard",
        dueDate: "2024-02-01T00:00:00Z",
      }),
      task({ id: "tie-first", title: "Premier ex æquo" }),
      task({
        id: "urgent",
        title: "Priorité urgente",
        priority: "URGENT",
        dueDate: null,
      }),
      task({ id: "tie-second", title: "Second ex æquo" }),
    ];
    mockTaskRequests(() => tasksResponse(tasks));
    renderDetails();

    const list = await screen.findByRole("list", { name: "Tâches du projet" });
    expect(
      within(list)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([
      "Priorité urgente",
      "Premier ex æquo",
      "Second ex æquo",
      "Haute plus tard",
      "Haute sans échéance",
      "Priorité moyenne",
      "Priorité basse",
    ]);
  });

  it("opens real comments by keyboard with author, date, content and expanded state", async () => {
    const user = userEvent.setup();
    mockTaskRequests(() =>
      tasksResponse([
        task({
          comments: [
            {
              id: "review",
              content: "Le schéma est validé.\nPrêt pour la suite.",
              createdAt: "2024-01-16T23:30:00-05:00",
              author: alice,
            },
            {
              id: "reply",
              content: "Merci pour la validation.",
              createdAt: "2024-01-18T09:00:00Z",
              author: { id: "bob", email: "bob@example.com", name: null },
            },
          ],
        }),
      ]),
    );
    renderDetails();

    const trigger = await screen.findByRole("button", {
      name: "Commentaires (2)",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Le schéma est validé/)).not.toBeInTheDocument();
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const comments = screen.getByRole("list", {
      name: "Commentaires",
    });
    expect(within(comments).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(comments).getByText("Alice Martin", { exact: true }),
    ).toBeVisible();
    expect(
      within(comments).getByText("bob@example.com", { exact: true }),
    ).toBeVisible();
    expect(
      within(comments).getByText("16 janvier 2024", { exact: true }),
    ).toBeVisible();
    expect(
      within(comments).getByText("18 janvier 2024", { exact: true }),
    ).toBeVisible();
    expect(
      within(comments).getByText(
        /Le schéma est validé\.\s*Prêt pour la suite\./,
      ),
    ).toBeVisible();
    expect(
      within(comments).getByText("Merci pour la validation."),
    ).toBeVisible();
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Le schéma est validé/)).not.toBeInTheDocument();
  });

  it("announces the absence of comments when the empty disclosure is opened", async () => {
    const user = userEvent.setup();
    mockTaskRequests(() => tasksResponse([task()]));
    renderDetails();

    const trigger = await screen.findByRole("button", {
      name: "Commentaires (0)",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Aucun commentaire.")).toBeVisible();
  });

  it("preserves stale tasks when an explicit refetch fails and lets the user retry", async () => {
    const user = userEvent.setup();
    let client!: QueryClient;
    let taskRequests = 0;
    mockTaskRequests(() => {
      taskRequests += 1;
      return taskRequests === 2
        ? new Response(null, { status: 500 })
        : tasksResponse([task()]);
    });
    renderDetails((queryClient) => {
      client = queryClient;
    });
    expect(
      await screen.findByRole("heading", { level: 3, name: task().title }),
    ).toBeVisible();

    await act(async () => {
      await client.refetchQueries({
        queryKey: ["projects", project.id, "tasks"],
        exact: true,
      });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/tâches/i);
    expect(
      screen.getByRole("heading", { level: 1, name: project.name }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: task().title }),
    ).toBeVisible();
    expect(
      screen.queryByText("Aucune tâche pour ce projet."),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(taskRequests).toBe(3);
    expect(
      screen.getByRole("heading", { level: 3, name: task().title }),
    ).toBeVisible();
  });
});
