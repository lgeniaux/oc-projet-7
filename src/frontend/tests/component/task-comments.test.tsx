import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { ProjectTaskList } from "@/modules/projects/project-task-list";
import type { ProjectTask } from "@/modules/projects/project-query";
import { TaskComments } from "@/modules/tasks/task-comments";

const apiFetch = vi.fn<typeof fetch>();
const projectId = "comment-project";
const alice = { id: "alice", name: "Alice Martin", email: "alice@example.com" };
const task = {
  id: "publication",
  title: "Préparer la publication",
  description: null,
  status: "TODO",
  priority: "MEDIUM",
  dueDate: null,
  assignees: [],
  comments: [],
} satisfies ProjectTask;
const comment = {
  id: "published-comment",
  content: "La publication est prête.",
  createdAt: "2026-10-22T09:30:00.000Z",
  author: alice,
};
let publicationResponse: (() => Response | Promise<Response>) | undefined;
let serverComments: ProjectTask["comments"];
let taskRequests: number;

beforeEach(() => {
  sessionStorage.setItem("authToken", "comment-token");
  vi.stubGlobal("fetch", apiFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  publicationResponse = undefined;
  serverComments = [];
  taskRequests = 0;
  apiFetch.mockImplementation(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (
      path === `/projects/${projectId}/tasks/${task.id}/comments` &&
      init?.method === "POST"
    ) {
      if (publicationResponse) return publicationResponse();
      const body: { content: string } = JSON.parse(String(init.body));
      const publishedComment = { ...comment, content: body.content };
      serverComments = [...serverComments, publishedComment];
      return Response.json(
        { success: true, data: { comment: publishedComment } },
        { status: 201 },
      );
    }
    if (path === `/projects/${projectId}/tasks`) {
      taskRequests += 1;
      return Response.json({
        success: true,
        data: { tasks: [{ ...task, comments: serverComments }] },
      });
    }
    throw new Error(`Unexpected request: ${path}`);
  });
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function renderComments() {
  render(
    <AppQueryProvider>
      <TaskComments projectId={projectId} task={task} />
    </AppQueryProvider>,
  );
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

describe("task comments", () => {
  it("keeps the empty form inside the keyboard-accessible disclosure", async () => {
    const user = userEvent.setup();
    renderComments();

    const trigger = screen.getByRole("button", { name: "Commentaires (0)" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Publier le commentaire" }),
    ).not.toBeInTheDocument();
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Aucun commentaire.")).toBeVisible();
    const content = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    expect(content).toHaveValue("");
    expect(content).toBeRequired();
    expect(content).toHaveAccessibleDescription(/1 à 2 000 caractères/);
    expect(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    ).toBeEnabled();
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it.each([
    { label: "blank content", content: "", error: /Saisissez un commentaire/ },
    {
      label: "whitespace-only content",
      content: "  \n\t  ",
      error: /Saisissez un commentaire/,
    },
    {
      label: "more than 2,000 trimmed characters",
      content: `  ${"x".repeat(2001)}  `,
      error: /2 000 caractères/,
    },
  ])("rejects $label without sending a request", async ({ content, error }) => {
    const user = userEvent.setup();
    renderComments();
    await user.click(screen.getByRole("button", { name: "Commentaires (0)" }));
    const input = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    fireEvent.change(input, { target: { value: content } });
    await user.click(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(error);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(error);
    expect(input).toHaveValue(content);
    expect(input).toHaveFocus();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it.each([
    { label: "one character", content: "x" },
    { label: "2,000 characters", content: "x".repeat(2000) },
  ])(
    "trims and publishes $label by keyboard then resets and announces success",
    async ({ content }) => {
      const user = userEvent.setup();
      renderComments();
      await user.click(
        screen.getByRole("button", { name: "Commentaires (0)" }),
      );
      const input = screen.getByRole("textbox", {
        name: "Ajouter un commentaire",
      });
      fireEvent.change(input, { target: { value: `  ${content} \n` } });
      input.focus();
      await user.tab();
      expect(
        screen.getByRole("button", { name: "Publier le commentaire" }),
      ).toHaveFocus();
      await user.keyboard("{Enter}");

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Commentaire publié.",
      );
      expect(input).toHaveValue("");
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(apiFetch).toHaveBeenCalledTimes(1);
      const [url, init] = apiFetch.mock.calls[0];
      expect(String(url)).toBe(
        `http://localhost:8000/projects/${projectId}/tasks/${task.id}/comments`,
      );
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({ content });
      expect(new Headers(init?.headers).get("Content-Type")).toBe(
        "application/json",
      );
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer comment-token",
      );
    },
  );

  it("disables the textarea and publication button while sending", async () => {
    const pending = Promise.withResolvers<Response>();
    publicationResponse = () => pending.promise;
    const user = userEvent.setup();
    renderComments();
    await user.click(screen.getByRole("button", { name: "Commentaires (0)" }));
    const input = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    await user.type(input, comment.content);
    await user.click(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    );

    expect(
      await screen.findByRole("button", { name: "Publication…" }),
    ).toBeDisabled();
    expect(input).toBeDisabled();
    expect(input).toHaveValue(comment.content);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await act(async () => {
      pending.resolve(
        Response.json({ success: true, data: { comment } }, { status: 201 }),
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Commentaire publié.",
    );
    await waitFor(() => expect(input).toBeEnabled());
    expect(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    ).toBeEnabled();
  });

  it("refetches the real project task query and invalidates the whole dashboard prefix", async () => {
    const user = userEvent.setup();
    let client!: QueryClient;
    const dashboardKeys = [
      ["dashboard"],
      ["dashboard", "tasks"],
      ["dashboard", "kanban", "2026-10"],
    ];
    render(
      <AppQueryProvider>
        <QueryClientCapture
          capture={(queryClient) => {
            client = queryClient;
            for (const queryKey of dashboardKeys) {
              client.setQueryData(queryKey, { count: 0 });
            }
            client.setQueryData(["projects", "another-project", "tasks"], []);
          }}
        />
        <ProjectTaskList projectId={projectId} />
      </AppQueryProvider>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Commentaires (0)" }),
    );
    expect(taskRequests).toBe(1);
    const input = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    await user.type(input, comment.content);
    await user.click(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Commentaire publié.",
    );
    const trigger = await screen.findByRole("button", {
      name: "Commentaires (1)",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const comments = screen.getByRole("list", { name: "Commentaires" });
    expect(within(comments).getAllByRole("listitem")).toHaveLength(1);
    expect(within(comments).getByText(comment.content)).toBeVisible();
    expect(within(comments).getByText(alice.name)).toBeVisible();
    expect(within(comments).getByText("22 octobre 2026")).toHaveAttribute(
      "dateTime",
      comment.createdAt,
    );
    expect(screen.queryByText("Aucun commentaire.")).not.toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(taskRequests).toBe(2);
    await waitFor(() => {
      for (const queryKey of dashboardKeys) {
        expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
      }
    });
    expect(
      client.getQueryState(["projects", "another-project", "tasks"])
        ?.isInvalidated,
    ).toBe(false);
  });

  it.each([403, 404, 500])(
    "keeps the draft and announces a publication error after HTTP %i",
    async (status) => {
      publicationResponse = () => new Response(null, { status });
      const user = userEvent.setup();
      renderComments();
      await user.click(
        screen.getByRole("button", { name: "Commentaires (0)" }),
      );
      const input = screen.getByRole("textbox", {
        name: "Ajouter un commentaire",
      });
      await user.type(input, comment.content);
      await user.click(
        screen.getByRole("button", { name: "Publier le commentaire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /texte est conservé/,
      );
      expect(input).toHaveValue(comment.content);
      expect(
        screen.getByRole("button", { name: "Publier le commentaire" }),
      ).toBeEnabled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Commentaires (0)" }),
      ).toBeVisible();
      expect(sessionStorage.getItem("authToken")).toBe("comment-token");
    },
  );

  it("rejects a malformed success response without clearing or confirming the draft", async () => {
    publicationResponse = () =>
      Response.json(
        {
          success: true,
          data: {
            comment: {
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
            },
          },
        },
        { status: 201 },
      );
    const user = userEvent.setup();
    renderComments();
    await user.click(screen.getByRole("button", { name: "Commentaires (0)" }));
    const input = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    await user.type(input, comment.content);
    await user.click(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Impossible de publier le commentaire/,
    );
    expect(input).toHaveValue(comment.content);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    ).toBeEnabled();
  });

  it("leaves a rejected session to the authenticated transport without a local error", async () => {
    publicationResponse = () => new Response(null, { status: 401 });
    const user = userEvent.setup();
    renderComments();
    await user.click(screen.getByRole("button", { name: "Commentaires (0)" }));
    const input = screen.getByRole("textbox", {
      name: "Ajouter un commentaire",
    });
    await user.type(input, comment.content);
    await user.click(
      screen.getByRole("button", { name: "Publier le commentaire" }),
    );

    await waitFor(() => {
      expect(sessionStorage.getItem("authToken")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Publier le commentaire" }),
      ).toBeEnabled();
    });
    expect(input).toHaveValue(comment.content);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
