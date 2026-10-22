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
import type { AssignedTask } from "@/modules/dashboard/assigned-tasks-query";
import { DashboardAssignedTasks } from "@/modules/dashboard/dashboard-assigned-tasks";

const apiFetch = vi.fn<typeof fetch>();
const task = {
  id: "database",
  title: "Conception de la base de données",
  description: "Définir les relations entre les tables.",
  status: "TODO",
  priority: "HIGH",
  dueDate: "2024-01-15T00:00:00.000Z",
  project: { id: "site", name: "Site vitrine" },
  comments: [{ id: "first" }, { id: "second" }],
} satisfies AssignedTask;

function tasksResponse(tasks: AssignedTask[]) {
  return Response.json({ success: true, data: { tasks } });
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

function renderTasks(capture?: (client: QueryClient) => void) {
  render(
    <AppQueryProvider>
      {capture && <QueryClientCapture capture={capture} />}
      <DashboardAssignedTasks />
    </AppQueryProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("authToken", "dashboard-tasks-token");
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

describe("dashboard assigned tasks", () => {
  it("announces loading then renders real metadata and task-specific links from the dashboard endpoint", async () => {
    const { promise, resolve } = Promise.withResolvers<Response>();
    apiFetch.mockReturnValue(promise);
    renderTasks();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement des tâches assignées…",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await act(async () => {
      resolve(
        tasksResponse([
          task,
          {
            ...task,
            id: "review",
            title: "Revoir le contenu",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            description: null,
            dueDate: null,
            comments: [],
          },
        ]),
      );
    });
    const list = await screen.findByRole("list", { name: "Tâches assignées" });
    const cards = within(list).getAllByRole("listitem");
    expect(
      within(cards[0]).getByRole("heading", { level: 3 }),
    ).toHaveTextContent(task.title);
    expect(within(cards[0]).getByText(task.description)).toBeVisible();
    expect(within(cards[0]).getByText("À faire")).toBeVisible();
    expect(within(cards[0]).getByText("Site vitrine")).toBeVisible();
    expect(within(cards[0]).getByText("15 janvier 2024")).toHaveAttribute(
      "dateTime",
      "2024-01-15",
    );
    const count = within(cards[0]).getByText("Commentaires").closest("div")!;
    expect(within(count).getByRole("definition")).toHaveTextContent("2");
    expect(
      within(cards[0]).getByRole("link", {
        name: `Voir la tâche « ${task.title} »`,
      }),
    ).toHaveAttribute("href", "/projects/site#task-database");
    expect(within(cards[1]).getByText("En cours")).toBeVisible();
    expect(within(cards[1]).getByText("Aucune description.")).toBeVisible();
    expect(within(cards[1]).getByText("Aucune échéance")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledOnce();
    const [url, options] = apiFetch.mock.calls[0];
    expect(String(url)).toBe("http://localhost:8000/dashboard/assigned-tasks");
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer dashboard-tasks-token",
    );
  });

  it.each([
    { label: "no assigned tasks", tasks: [] },
    {
      label: "only closed tasks",
      tasks: [
        { ...task, status: "DONE" },
        { ...task, id: "cancelled", status: "CANCELLED" },
      ],
    },
  ] satisfies { label: string; tasks: AssignedTask[] }[])(
    "announces an empty list with $label",
    async ({ tasks }) => {
      apiFetch.mockResolvedValue(tasksResponse(tasks));
      renderTasks();
      expect(
        await screen.findByText(
          "Aucune tâche en cours ou à faire ne vous est assignée.",
        ),
      ).toHaveAttribute("role", "status");
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    },
  );

  it.each(["server", "invalid"])(
    "announces a %s response as an error and retries on request",
    async (failure) => {
      const user = userEvent.setup();
      apiFetch
        .mockResolvedValueOnce(
          failure === "server"
            ? new Response(null, { status: 500 })
            : Response.json({
                success: true,
                data: { tasks: [{ ...task, dueDate: "invalid" }] },
              }),
        )
        .mockResolvedValueOnce(tasksResponse([task]));
      renderTasks();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Les tâches assignées sont indisponibles pour le moment. Réessayez.",
      );
      expect(
        screen.queryByText(/Aucune tâche en cours/),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Réessayer" }));
      expect(
        await screen.findByRole("heading", { level: 3, name: task.title }),
      ).toBeVisible();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(apiFetch).toHaveBeenCalledTimes(2);
    },
  );

  it("keeps the last tasks visible when a dashboard invalidation fails then lets the user retry", async () => {
    const user = userEvent.setup();
    let client!: QueryClient;
    apiFetch
      .mockResolvedValueOnce(tasksResponse([task]))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(tasksResponse([task]));
    renderTasks((queryClient) => {
      client = queryClient;
    });
    expect(
      await screen.findByRole("heading", { level: 3, name: task.title }),
    ).toBeVisible();
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "L’actualisation des tâches assignées est indisponible. Les dernières tâches restent affichées.",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: task.title }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(apiFetch).toHaveBeenCalledTimes(3);
  });
});
