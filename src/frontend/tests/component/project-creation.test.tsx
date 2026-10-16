import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { clearAuthToken } from "@/modules/auth/session";
import { ProjectList } from "@/modules/projects/project-list";

const apiFetch = vi.fn<typeof fetch>();
const alice = { id: "alice", name: "Alice Martin", email: "alice@example.com" };
const bob = { id: "bob", name: "Bob Dupont", email: "bob@example.com" };
const project = {
  id: "created-project",
  name: "Nouveau projet",
  description: null,
  owner: alice,
  members: [{ role: "CONTRIBUTOR", user: bob }],
  _count: { tasks: 0 },
};
let searchUsers: (typeof bob)[];
let searchResponse: (() => Promise<Response>) | undefined;
let creationResponse: (() => Promise<Response>) | undefined;
let created: boolean;

beforeEach(() => {
  sessionStorage.setItem("authToken", "creation-token");
  vi.stubGlobal("fetch", apiFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  searchUsers = [alice, bob];
  searchResponse = undefined;
  creationResponse = undefined;
  created = false;
  apiFetch.mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/profile")
      return Response.json({ success: true, data: { user: alice } });
    if (url.pathname === "/users/search")
      return searchResponse
        ? searchResponse()
        : Response.json({ success: true, data: { users: searchUsers } });
    if (url.pathname === "/projects" && init?.method === "POST") {
      if (creationResponse) return creationResponse();
      created = true;
      return Response.json(
        { success: true, data: { project } },
        { status: 201 },
      );
    }
    if (url.pathname === "/projects")
      return Response.json({
        success: true,
        data: { projects: created ? [{ ...project, userRole: "ADMIN" }] : [] },
      });
    if (url.pathname.endsWith("/tasks"))
      return Response.json({ success: true, data: { tasks: [] } });
    throw new Error(`Unexpected request: ${url.pathname}`);
  });
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function openCreation() {
  const user = userEvent.setup();
  render(
    <AppQueryProvider>
      <ProjectList />
    </AppQueryProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Créer un projet" }));
  const dialog = screen.getByRole("dialog", { name: "Créer un projet" });
  return { user, dialog };
}

async function chooseBob(user: UserEvent) {
  await user.type(screen.getByRole("searchbox"), "bob");
  await user.click(
    await screen.findByRole("button", { name: "Ajouter Bob Dupont" }),
  );
}

describe("project creation", () => {
  it("validates trimmed title and description limits and keeps submission available", async () => {
    const { user } = await openCreation();
    const submit = screen.getByRole("button", { name: "Ajouter un projet" });
    expect(submit).toBeEnabled();
    await user.type(screen.getByRole("textbox", { name: "Titre" }), " a ");
    await user.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /au moins 2 caractères/,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Titre" }), {
      target: { value: "x".repeat(101) },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "x".repeat(501) },
    });
    await user.click(submit);
    expect(
      await screen.findByText(/titre ne peut pas dépasser 100/),
    ).toBeVisible();
    expect(
      screen.getByText(/description ne peut pas dépasser 500/),
    ).toBeVisible();
    expect(
      apiFetch.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("shows a short-query hint, loading and no results without searching under two characters", async () => {
    const pending = Promise.withResolvers<Response>();
    searchResponse = () => pending.promise;
    const { user } = await openCreation();
    expect(
      await screen.findByText(/Saisissez au moins 2 caractères/),
    ).toBeVisible();
    await user.type(screen.getByRole("searchbox"), "z");
    expect(
      apiFetch.mock.calls.some(([url]) =>
        String(url).includes("/users/search"),
      ),
    ).toBe(false);
    await user.type(screen.getByRole("searchbox"), "z");
    expect(screen.getByText("Recherche en cours…")).toBeVisible();
    await waitFor(() =>
      expect(
        apiFetch.mock.calls.some(([url]) =>
          String(url).includes("/users/search"),
        ),
      ).toBe(true),
    );
    await act(async () => {
      pending.resolve(Response.json({ success: true, data: { users: [] } }));
    });
    expect(await screen.findByText("Aucun utilisateur trouvé.")).toBeVisible();
  });

  it("excludes the current user and selected users, and allows removing a contributor", async () => {
    const { user } = await openCreation();
    await chooseBob(user);
    expect(
      screen.queryByRole("button", { name: "Ajouter Alice Martin" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ajouter Bob Dupont" }),
    ).not.toBeInTheDocument();
    const selected = screen.getByRole("list", {
      name: "Contributeurs sélectionnés",
    });
    expect(within(selected).getByText(/bob@example.com/)).toBeVisible();
    await user.click(
      within(selected).getByRole("button", { name: "Retirer Bob Dupont" }),
    );
    expect(
      await screen.findByRole("button", { name: "Ajouter Bob Dupont" }),
    ).toBeVisible();
    expect(screen.getByText(/1 utilisateur trouvé/)).toBeVisible();
  });

  it("reports a search error and retries", async () => {
    searchResponse = async () => new Response(null, { status: 500 });
    const { user } = await openCreation();
    await user.type(screen.getByRole("searchbox"), "bob");
    expect(
      await screen.findByText("La recherche est indisponible. Réessayez."),
    ).toBeVisible();
    searchResponse = undefined;
    await user.click(
      screen.getByRole("button", { name: "Réessayer la recherche" }),
    );
    expect(
      await screen.findByRole("button", { name: "Ajouter Bob Dupont" }),
    ).toBeVisible();
  });

  it("creates with chosen emails, closes, restores focus and refreshes the list", async () => {
    const { user } = await openCreation();
    await user.type(
      screen.getByRole("textbox", { name: "Titre" }),
      "  Nouveau projet  ",
    );
    await chooseBob(user);
    await user.click(screen.getByRole("button", { name: "Ajouter un projet" }));
    expect(
      await screen.findByText("Projet « Nouveau projet » créé."),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Créer un projet" }),
      ).toHaveFocus(),
    );
    expect(
      await screen.findByRole("link", { name: "Nouveau projet" }),
    ).toBeVisible();
    const request = apiFetch.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      name: "Nouveau projet",
      contributors: ["bob@example.com"],
    });
    expect(new Headers(request?.[1]?.headers).get("Authorization")).toBe(
      "Bearer creation-token",
    );
    await user.click(screen.getByRole("button", { name: "Créer un projet" }));
    expect(screen.getByRole("textbox", { name: "Titre" })).toHaveValue("");
    expect(
      screen.queryByRole("list", { name: "Contributeurs sélectionnés" }),
    ).not.toBeInTheDocument();
  });

  it.each([400, 500])(
    "keeps fields and contributors after a backend %i error",
    async (status) => {
      creationResponse = async () =>
        status === 400
          ? Response.json(
              {
                success: false,
                data: {
                  errors: [
                    { field: "name", message: "invalid" },
                    { field: "contributors[0]", message: "invalid" },
                  ],
                },
              },
              { status },
            )
          : new Response(null, { status });
      const { user } = await openCreation();
      await user.type(
        screen.getByRole("textbox", { name: "Titre" }),
        "Mon projet",
      );
      await user.type(
        screen.getByRole("textbox", { name: "Description" }),
        "Ma description",
      );
      await chooseBob(user);
      await user.click(
        screen.getByRole("button", { name: "Ajouter un projet" }),
      );
      expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(screen.getByRole("textbox", { name: "Titre" })).toHaveValue(
        "Mon projet",
      );
      expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
        "Ma description",
      );
      expect(
        screen.getByRole("button", { name: "Retirer Bob Dupont" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Ajouter un projet" }),
      ).toBeEnabled();
    },
  );

  it("warns about missing returned members without treating the created project as failed", async () => {
    creationResponse = async () =>
      Response.json(
        { success: true, data: { project: { ...project, members: [] } } },
        { status: 201 },
      );
    const { user } = await openCreation();
    await user.type(
      screen.getByRole("textbox", { name: "Titre" }),
      project.name,
    );
    await chooseBob(user);
    await user.click(screen.getByRole("button", { name: "Ajouter un projet" }));
    expect(await screen.findByText(/mais ces contributeurs/)).toHaveTextContent(
      "bob@example.com",
    );
    expect(screen.getByText("Projet « Nouveau projet » créé.")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps focus and closes with Escape or the French close button", async () => {
    const { user, dialog } = await openCreation();
    expect(
      within(dialog).getByRole("textbox", { name: "Titre" }),
    ).toHaveFocus();
    await user.tab({ shift: true });
    expect(
      within(dialog).getByRole("button", {
        name: "Fermer la fenêtre de création",
      }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Créer un projet" }),
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Créer un projet" }));
    await user.click(
      screen.getByRole("button", { name: "Fermer la fenêtre de création" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
