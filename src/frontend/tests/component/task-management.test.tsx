import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { ProjectDetails } from "@/modules/projects/project-details";
import type { Project, ProjectTask } from "@/modules/projects/project-query";

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const apiFetch = vi.fn<typeof fetch>();
const alice = { id: "alice", name: "Alice Martin", email: "alice@example.com" };
const bob = { id: "bob", name: "Bob Dupont", email: "bob@example.com" };
const caroline = {
  id: "caroline",
  name: "Caroline Leroy",
  email: "caroline@example.com",
};
const people = [alice, bob, caroline];
const project: Project = {
  id: "task-project",
  name: "Site vitrine",
  description: null,
  owner: alice,
  members: [{ role: "CONTRIBUTOR", user: bob }],
  _count: { tasks: 1 },
  userRole: "ADMIN",
};
const tasksPath = `/projects/${project.id}/tasks`;
let tasks: ProjectTask[];
let client: QueryClient;
let mutation:
  ((path: string, init: RequestInit) => Response | undefined) | undefined;

function task(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "existing",
    title: "Maquette de l'accueil",
    description: "Dessiner la page d'accueil.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "2024-01-15T00:00:00.000Z",
    assignees: [{ id: "assignment-bob", user: bob }],
    comments: [],
    ...overrides,
  };
}

function assign(ids: string[]) {
  return ids.map((id) => ({
    id: `assignment-${id}`,
    user: people.find((person) => person.id === id)!,
  }));
}

function CaptureClient() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  return null;
}

async function renderDetails() {
  const user = userEvent.setup();
  render(
    <AppQueryProvider>
      <CaptureClient />
      <ProjectDetails projectId={project.id} />
    </AppQueryProvider>,
  );
  await screen.findByRole("list", { name: "Tâches du projet" });
  // A cached dashboard view must be refreshed by every task write.
  client.setQueryData(["dashboard", "assigned-tasks"], []);
  return user;
}

function writes() {
  return apiFetch.mock.calls
    .filter(([, init]) => init?.method && init.method !== "GET")
    .map(([input, init]) => ({
      method: init!.method,
      path: new URL(String(input)).pathname,
      body: init!.body ? JSON.parse(String(init!.body)) : undefined,
    }));
}

function card(title: string) {
  return screen
    .getByRole("heading", { level: 3, name: title })
    .closest("li") as HTMLElement;
}

async function openCreation(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Créer une tâche" }));
  return screen.getByRole("dialog", { name: "Créer une tâche" });
}

async function fillRequiredFields(user: UserEvent, dialog: HTMLElement) {
  await user.type(
    within(dialog).getByRole("textbox", { name: "Titre" }),
    "  Rédiger les textes  ",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Description" }),
    "Textes de la page d'accueil.",
  );
  await user.type(within(dialog).getByLabelText(/^Échéance/), "2026-03-09");
}

async function chooseAssignees(user: UserEvent, names: string[]) {
  await user.click(screen.getByRole("button", { name: /^Assigné à/ }));
  for (const name of names)
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: new RegExp(name) }),
    );
  await user.keyboard("{Escape}");
}

async function openTaskMenu(user: UserEvent, title: string, action: string) {
  await user.click(
    screen.getByRole("button", { name: `Actions de la tâche « ${title} »` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: action }));
}

beforeEach(() => {
  tasks = [task()];
  mutation = undefined;
  sessionStorage.setItem("authToken", "task-token");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  vi.stubGlobal("fetch", apiFetch);
  // jsdom has no ResizeObserver; Radix radio groups measure their items.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  apiFetch.mockImplementation(async (input, init = {}) => {
    const path = new URL(String(input)).pathname;
    if (path === "/auth/profile")
      return Response.json({ success: true, data: { user: alice } });
    if (path === `/projects/${project.id}`)
      return Response.json({ success: true, data: { project } });
    const method = init.method ?? "GET";
    if (method === "GET" && path === tasksPath)
      return Response.json({ success: true, data: { tasks } });
    const override = mutation?.(path, init);
    if (override) return override;
    const body = init.body ? JSON.parse(String(init.body)) : {};
    if (method === "POST" && path === tasksPath) {
      const created = task({
        id: "created",
        title: body.title.trim(),
        description: body.description.trim(),
        priority: body.priority,
        dueDate: body.dueDate,
        assignees: assign(body.assigneeIds),
      });
      tasks = [...tasks, created];
      return Response.json(
        { success: true, data: { task: created } },
        { status: 201 },
      );
    }
    const id = path.split("/").at(-1);
    if (method === "PUT") {
      tasks = tasks.map((item) =>
        item.id === id
          ? {
              ...item,
              ...body,
              assignees: body.assigneeIds
                ? assign(body.assigneeIds)
                : item.assignees,
            }
          : item,
      );
      return Response.json({ success: true, data: {} });
    }
    if (method === "DELETE") {
      tasks = tasks.filter((item) => item.id !== id);
      return Response.json({ success: true });
    }
    throw new Error(`Unexpected request ${method} ${path}`);
  });
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("task creation", () => {
  it("explains the required fields without sending the form", async () => {
    const user = await renderDetails();
    const dialog = await openCreation(user);

    await user.click(
      within(dialog).getByRole("button", { name: "Ajouter une tâche" }),
    );

    expect(
      await within(dialog).findByText(
        "Le titre doit contenir au moins 2 caractères.",
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByText("La description est obligatoire."),
    ).toBeVisible();
    expect(
      within(dialog).getByText("L'échéance est obligatoire."),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("textbox", { name: "Titre" }),
    ).toHaveFocus();
    expect(
      within(dialog).getByRole("radio", { name: "Moyenne" }),
    ).toBeChecked();
    expect(
      within(dialog).getByRole("radio", { name: "À faire" }),
    ).toBeChecked();
    expect(
      within(dialog).queryByRole("radio", { name: "Annulée" }),
    ).not.toBeInTheDocument();
    expect(writes()).toEqual([]);
  });

  it("creates an assigned task, saves its status and shows it at once", async () => {
    const user = await renderDetails();
    const dialog = await openCreation(user);
    await fillRequiredFields(user, dialog);
    await chooseAssignees(user, ["Alice Martin", "Bob Dupont"]);
    expect(
      within(dialog).getByRole("button", { name: /^Assigné à/ }),
    ).toHaveTextContent("Alice Martin, Bob Dupont");
    await user.click(within(dialog).getByRole("radio", { name: "Haute" }));
    await user.click(within(dialog).getByRole("radio", { name: "En cours" }));

    await user.click(
      within(dialog).getByRole("button", { name: "Ajouter une tâche" }),
    );

    expect(
      await screen.findByText("Tâche « Rédiger les textes » créée."),
    ).toHaveAttribute("role", "status");
    expect(writes()).toEqual([
      {
        method: "POST",
        path: tasksPath,
        body: {
          title: "Rédiger les textes",
          description: "Textes de la page d'accueil.",
          dueDate: "2026-03-09T00:00:00.000Z",
          priority: "HIGH",
          assigneeIds: ["alice", "bob"],
        },
      },
      {
        method: "PUT",
        path: `${tasksPath}/created`,
        body: { status: "IN_PROGRESS" },
      },
    ]);
    expect(dialog).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Créer une tâche" }),
    ).toHaveFocus();
    await waitFor(() =>
      expect(within(card("Rédiger les textes")).getByText("En cours")),
    );
    expect(within(card("Rédiger les textes")).getByText("9 mars 2026"));
    expect(
      client.getQueryState(["dashboard", "assigned-tasks"])?.isInvalidated,
    ).toBe(true);
  });

  it("announces a task kept as « À faire » when its status cannot be saved", async () => {
    mutation = (path, init) =>
      init.method === "PUT" ? new Response(null, { status: 500 }) : undefined;
    const user = await renderDetails();
    const dialog = await openCreation(user);
    await fillRequiredFields(user, dialog);
    await user.click(within(dialog).getByRole("radio", { name: "Terminée" }));

    await user.click(
      within(dialog).getByRole("button", { name: "Ajouter une tâche" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La tâche « Rédiger les textes » a été créée avec le statut « À faire », mais le statut « Terminée » n'a pas pu être enregistré.",
    );
    expect(dialog).not.toBeInTheDocument();
    await waitFor(() =>
      expect(within(card("Rédiger les textes")).getByText("À faire")),
    );
    expect(writes().map(({ method }) => method)).toEqual(["POST", "PUT"]);
  });

  it("shows backend refusals in the form and keeps the inputs", async () => {
    let refusal = Response.json(
      {
        success: false,
        message: "Certains utilisateurs assignés ne sont pas membres du projet",
        error: "INVALID_ASSIGNEES",
      },
      { status: 400 },
    );
    mutation = () => refusal;
    const user = await renderDetails();
    const dialog = await openCreation(user);
    await fillRequiredFields(user, dialog);
    await chooseAssignees(user, ["Bob Dupont"]);
    const submit = within(dialog).getByRole("button", {
      name: "Ajouter une tâche",
    });

    await user.click(submit);

    const assignees = within(dialog).getByRole("button", {
      name: /^Assigné à/,
    });
    expect(
      await within(dialog).findByText(/ne fait plus partie du projet/),
    ).toBeVisible();
    expect(assignees).toHaveAttribute("aria-invalid", "true");

    refusal = Response.json({ success: false }, { status: 403 });
    await user.click(submit);

    expect(
      await within(dialog).findByText(
        "Ce projet n'existe plus ou vous n'y avez plus accès. Vos saisies sont conservées.",
      ),
    ).toBeVisible();
    expect(within(dialog).getByRole("textbox", { name: "Titre" })).toHaveValue(
      "  Rédiger les textes  ",
    );
    expect(writes().map(({ method }) => method)).toEqual(["POST", "POST"]);
  });
});

describe("task editing", () => {
  it("prefills the task and sends only the changed fields", async () => {
    const user = await renderDetails();
    await openTaskMenu(user, "Maquette de l'accueil", "Modifier");
    const dialog = screen.getByRole("dialog", { name: "Modifier une tâche" });
    expect(within(dialog).getByRole("textbox", { name: "Titre" })).toHaveValue(
      "Maquette de l'accueil",
    );
    expect(within(dialog).getByLabelText(/^Échéance/)).toHaveValue(
      "2024-01-15",
    );
    expect(
      within(dialog).getByRole("radio", { name: "À faire" }),
    ).toBeChecked();

    await chooseAssignees(user, ["Bob Dupont"]);
    await user.click(within(dialog).getByRole("radio", { name: "Terminée" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );

    expect(await screen.findByText("Tâche modifiée.")).toHaveAttribute(
      "role",
      "status",
    );
    expect(writes()).toEqual([
      {
        method: "PUT",
        path: `${tasksPath}/existing`,
        body: { status: "DONE", assigneeIds: [] },
      },
    ]);
    expect(
      screen.getByRole("button", {
        name: "Actions de la tâche « Maquette de l'accueil »",
      }),
    ).toHaveFocus();
    await waitFor(() =>
      expect(within(card("Maquette de l'accueil")).getByText("Terminée")),
    );
    expect(
      within(card("Maquette de l'accueil")).getByText("Non assignée"),
    ).toBeVisible();
  });

  it("keeps a cancelled status and drops assignees who left the project", async () => {
    tasks = [
      task({
        status: "CANCELLED",
        assignees: assign(["bob", "caroline"]),
      }),
    ];
    const user = await renderDetails();
    await openTaskMenu(user, "Maquette de l'accueil", "Modifier");
    const dialog = screen.getByRole("dialog", { name: "Modifier une tâche" });
    expect(
      within(dialog).getByRole("radio", { name: "Annulée" }),
    ).toBeChecked();
    expect(
      within(dialog).getByRole("button", { name: /^Assigné à/ }),
    ).toHaveAccessibleDescription(
      /Ne font plus partie du projet : Caroline Leroy/,
    );

    await user.type(
      within(dialog).getByRole("textbox", { name: "Titre" }),
      " v2",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );

    await screen.findByText("Tâche modifiée.");
    expect(writes()).toEqual([
      {
        method: "PUT",
        path: `${tasksPath}/existing`,
        body: { title: "Maquette de l'accueil v2", assigneeIds: ["bob"] },
      },
    ]);
  });
});

describe("task deletion", () => {
  it("asks for confirmation, then removes the task from the views", async () => {
    const user = await renderDetails();
    await openTaskMenu(user, "Maquette de l'accueil", "Supprimer");
    let confirmation = screen.getByRole("alertdialog", {
      name: "Supprimer cette tâche ?",
    });
    expect(
      within(confirmation).getByRole("button", { name: "Annuler" }),
    ).toHaveFocus();
    await user.click(
      within(confirmation).getByRole("button", { name: "Annuler" }),
    );
    expect(writes()).toEqual([]);

    await openTaskMenu(user, "Maquette de l'accueil", "Supprimer");
    confirmation = screen.getByRole("alertdialog", {
      name: "Supprimer cette tâche ?",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Supprimer la tâche" }),
    );

    expect(
      await screen.findByText("Tâche « Maquette de l'accueil » supprimée."),
    ).toHaveAttribute("role", "status");
    expect(writes()).toEqual([
      { method: "DELETE", path: `${tasksPath}/existing`, body: undefined },
    ]);
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Maquette de l'accueil",
      }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: "Tâches" }),
      ).toHaveFocus(),
    );
    expect(
      client.getQueryState(["dashboard", "assigned-tasks"])?.isInvalidated,
    ).toBe(true);
  });
});
