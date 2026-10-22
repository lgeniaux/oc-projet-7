import { useEffect, StrictMode } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  act,
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
import type { Project } from "@/modules/projects/project-query";

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
const david = { id: "david", name: "David Moreau", email: "david@example.com" };
let project: Project;
let viewer = alice;
let client: QueryClient;
let mutation:
  | ((
      path: string,
      init: RequestInit,
    ) => Response | Promise<Response> | undefined)
  | undefined;

function CaptureClient() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  return null;
}

function renderDetails() {
  render(
    <StrictMode>
      <AppQueryProvider>
        <CaptureClient />
        <ProjectDetails projectId={project.id} />
      </AppQueryProvider>
    </StrictMode>,
  );
}

function writes() {
  return apiFetch.mock.calls.filter(
    ([, init]) => init?.method && init.method !== "GET",
  );
}

async function openEditor() {
  const user = userEvent.setup();
  renderDetails();
  await user.click(await screen.findByRole("button", { name: "Modifier" }));
  return {
    user,
    dialog: screen.getByRole("dialog", { name: "Modifier un projet" }),
  };
}

async function addPerson(user: UserEvent, dialog: HTMLElement, name: string) {
  await user.clear(within(dialog).getByRole("searchbox"));
  await user.type(within(dialog).getByRole("searchbox"), name);
  await user.click(
    await within(dialog).findByRole("button", { name: `Ajouter ${name}` }),
  );
}

beforeEach(() => {
  project = {
    id: "editing-project",
    name: "Site vitrine",
    description: "Description initiale",
    owner: alice,
    members: [{ role: "CONTRIBUTOR", user: bob }],
    _count: { tasks: 0 },
    userRole: "ADMIN",
  };
  viewer = alice;
  mutation = undefined;
  sessionStorage.setItem("authToken", "editing-token");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  vi.stubGlobal("fetch", apiFetch);
  apiFetch.mockImplementation(async (input, init = {}) => {
    const path = new URL(String(input)).pathname;
    if (path === "/auth/profile")
      return Response.json({ success: true, data: { user: viewer } });
    if (path === "/users/search")
      return Response.json({
        success: true,
        data: { users: [alice, bob, caroline, david] },
      });
    if (init.method && init.method !== "GET") {
      const override = await mutation?.(path, init);
      if (override) return override;
      if (init.method === "PUT")
        project = { ...project, ...JSON.parse(String(init.body)) };
      if (init.method === "POST") {
        const { email } = JSON.parse(String(init.body));
        const person = [caroline, david].find((user) => user.email === email)!;
        project = {
          ...project,
          members: [...project.members, { role: "CONTRIBUTOR", user: person }],
        };
      }
      if (init.method === "DELETE" && path.includes("/contributors/")) {
        const id = decodeURIComponent(path.split("/").at(-1)!);
        project = {
          ...project,
          members: project.members.filter((member) => member.user.id !== id),
        };
      }
      return Response.json({ success: true });
    }
    if (path.endsWith("/tasks"))
      return Response.json({ success: true, data: { tasks: [] } });
    if (path === `/projects/${project.id}`)
      return Response.json({ success: true, data: { project } });
    throw new Error(`Unexpected request ${path}`);
  });
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  router.replace.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("project editing", () => {
  it("prefills the draft, sends an empty description to clear it, and refreshes without reload", async () => {
    const { user, dialog } = await openEditor();
    expect(within(dialog).getByRole("textbox", { name: "Titre" })).toHaveValue(
      project.name,
    );
    expect(
      within(dialog).getByRole("textbox", { name: "Description" }),
    ).toHaveValue(project.description);
    await user.clear(within(dialog).getByRole("textbox", { name: "Titre" }));
    await user.type(
      within(dialog).getByRole("textbox", { name: "Titre" }),
      "Nouveau titre",
    );
    await user.clear(
      within(dialog).getByRole("textbox", { name: "Description" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    expect(await screen.findByText("Projet modifié.")).toHaveAttribute(
      "role",
      "status",
    );
    expect(writes()).toHaveLength(1);
    expect(JSON.parse(String(writes()[0][1]?.body))).toEqual({
      name: "Nouveau titre",
      description: "",
    });
    expect(writes()[0][1]?.method).toBe("PUT");
    expect(
      screen.getByRole("heading", { level: 1, name: "Nouveau titre" }),
    ).toBeVisible();
    expect(screen.getByText("Aucune description.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Modifier" })).toHaveFocus();
  });

  it("saves unchanged fields without a PUT and drops a closed draft", async () => {
    const { user, dialog } = await openEditor();
    await user.clear(within(dialog).getByRole("textbox", { name: "Titre" }));
    await user.type(
      within(dialog).getByRole("textbox", { name: "Titre" }),
      "Abandonné",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Fermer la fenêtre de modification",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Modifier" }));
    expect(screen.getByRole("textbox", { name: "Titre" })).toHaveValue(
      project.name,
    );
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await screen.findByText("Projet modifié.");
    expect(writes()).toHaveLength(0);
  });

  it("adds by email without a role, then removes by user id", async () => {
    const { user, dialog } = await openEditor();
    await user.click(
      within(dialog).getByRole("button", { name: "Retirer Bob Dupont" }),
    );
    await addPerson(user, dialog, caroline.name);
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await screen.findByText("Projet modifié.");
    expect(
      writes().map(([input, init]) => [
        new URL(String(input)).pathname,
        init?.method,
      ]),
    ).toEqual([
      [`/projects/${project.id}/contributors`, "POST"],
      [`/projects/${project.id}/contributors/bob`, "DELETE"],
    ]);
    expect(JSON.parse(String(writes()[0][1]?.body))).toEqual({
      email: caroline.email,
    });
    const contributors = screen.getByRole("list", {
      name: "Contributeurs du projet",
    });
    expect(within(contributors).getByText(caroline.name)).toBeVisible();
    expect(within(contributors).queryByText(bob.name)).not.toBeInTheDocument();
  });

  it("never offers the owner or self-removal to an admin member", async () => {
    viewer = bob;
    project.members = [{ role: "ADMIN", user: bob }];
    const { user, dialog } = await openEditor();
    expect(within(dialog).getByText(/Vous/)).toBeVisible();
    expect(
      within(dialog).queryByRole("button", { name: "Retirer Bob Dupont" }),
    ).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole("searchbox"), "Alice");
    await within(dialog).findByRole("list", { name: "Résultats de recherche" });
    expect(
      within(dialog).queryByRole("button", { name: "Ajouter Alice Martin" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Ajouter Bob Dupont" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Supprimer le projet" }),
    ).not.toBeInTheDocument();
  });

  it("reports partial success by person and retries from refreshed members", async () => {
    mutation = (_path, init) =>
      init.method === "POST" &&
      JSON.parse(String(init.body)).email === david.email
        ? Response.json({ error: "USER_NOT_FOUND" }, { status: 404 })
        : undefined;
    const { user, dialog } = await openEditor();
    await user.type(
      within(dialog).getByRole("textbox", { name: "Titre" }),
      " modifié",
    );
    await addPerson(user, dialog, caroline.name);
    await addPerson(user, dialog, david.name);
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(
      "Le titre et la description ont été enregistrés.",
    );
    expect(alert).toHaveTextContent("David Moreau : introuvable");
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole("list", { name: "Contributeurs sélectionnés" }),
    ).toHaveTextContent(caroline.name);
    expect(
      within(dialog).queryByRole("button", { name: "Retirer David Moreau" }),
    ).not.toBeInTheDocument();
    mutation = undefined;
    await addPerson(user, dialog, david.name);
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await screen.findByText("Projet modifié.");
    expect(writes().filter(([, init]) => init?.method === "PUT")).toHaveLength(
      1,
    );
    expect(
      writes().filter(
        ([, init]) =>
          init?.method === "POST" &&
          JSON.parse(String(init.body)).email === caroline.email,
      ),
    ).toHaveLength(1);
    expect(
      writes().filter(
        ([, init]) =>
          init?.method === "POST" &&
          JSON.parse(String(init.body)).email === david.email,
      ),
    ).toHaveLength(2);
  });

  it("accepts an already present contributor as success", async () => {
    mutation = () =>
      Response.json({ error: "USER_ALREADY_MEMBER" }, { status: 409 });
    const { user, dialog } = await openEditor();
    await addPerson(user, dialog, caroline.name);
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await screen.findByText("Projet modifié.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([400, 403, 500, 401])(
    "stops member writes after PUT HTTP %i",
    async (status) => {
      mutation = () =>
        Response.json(
          status === 400
            ? { data: { errors: [{ field: "name", message: "Invalid" }] } }
            : {},
          { status },
        );
      const { user, dialog } = await openEditor();
      await user.type(
        within(dialog).getByRole("textbox", { name: "Titre" }),
        " modifié",
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Retirer Bob Dupont" }),
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Enregistrer" }),
      );
      await waitFor(() =>
        expect(
          within(dialog).getByRole("button", { name: "Enregistrer" }),
        ).toBeEnabled(),
      );
      expect(writes()).toHaveLength(1);
      if (status === 401) {
        expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
        expect(sessionStorage.getItem("authToken")).toBeNull();
      } else {
        expect(within(dialog).getByRole("alert")).toHaveTextContent(
          status === 403
            ? "Vous n'avez plus l'autorisation"
            : status === 400
              ? "Le titre doit contenir"
              : "Impossible d'enregistrer",
        );
      }
    },
  );

  it("blocks closing the editor while a save is pending", async () => {
    const pending = Promise.withResolvers<Response>();
    mutation = () => pending.promise;
    const { user, dialog } = await openEditor();
    await user.type(
      within(dialog).getByRole("textbox", { name: "Titre" }),
      " modifié",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" }),
    );
    await user.keyboard("{Escape}");
    await user.click(
      within(dialog).getByRole("button", {
        name: "Fermer la fenêtre de modification",
      }),
    );
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Enregistrement…" }),
    ).toBeDisabled();
    await act(async () => pending.resolve(Response.json({ success: true })));
    await screen.findByText("Projet modifié.");
  });
});

describe("project deletion", () => {
  it("cancels without a DELETE, then deletes and removes the cache after observers unmount", async () => {
    const { user, dialog } = await openEditor();
    client.setQueryData(["projects"], [project]);
    const detailReads = () =>
      apiFetch.mock.calls.filter(
        ([input, init]) =>
          new URL(String(input)).pathname === `/projects/${project.id}` &&
          !init?.method,
      ).length;
    const previousReads = detailReads();
    await user.click(
      within(dialog).getByRole("button", { name: "Supprimer le projet" }),
    );
    let confirmation = screen.getByRole("alertdialog", {
      name: "Supprimer ce projet ?",
    });
    expect(
      within(confirmation).getByRole("button", { name: "Annuler" }),
    ).toHaveFocus();
    await user.click(
      within(confirmation).getByRole("button", { name: "Annuler" }),
    );
    expect(writes()).toHaveLength(0);
    await user.click(
      within(dialog).getByRole("button", { name: "Supprimer le projet" }),
    );
    confirmation = screen.getByRole("alertdialog");
    const pending = Promise.withResolvers<Response>();
    mutation = () => pending.promise;
    await user.click(
      within(confirmation).getByRole("button", { name: "Supprimer le projet" }),
    );
    expect(
      within(confirmation).getByRole("button", { name: "Suppression…" }),
    ).toBeDisabled();
    expect(
      within(confirmation).getByRole("button", { name: "Annuler" }),
    ).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(confirmation).toBeVisible();
    await act(async () => pending.resolve(Response.json({ success: true })));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/projects"),
    );
    expect(writes()).toHaveLength(1);
    expect(writes()[0][1]?.method).toBe("DELETE");
    expect(screen.getByRole("status")).toHaveTextContent("Projet supprimé.");
    expect(screen.queryByText("Projet inaccessible")).not.toBeInTheDocument();
    expect(client.getQueryData(["projects"])).toEqual([]);
    expect(client.getQueryData(["projects", project.id])).toBeUndefined();
    expect(
      client.getQueryData(["projects", project.id, "tasks"]),
    ).toBeUndefined();
    expect(detailReads()).toBe(previousReads);
  });

  it.each([403, 500, 401])(
    "handles delete HTTP %i without navigating",
    async (status) => {
      mutation = () => new Response(null, { status });
      const { user, dialog } = await openEditor();
      await user.click(
        within(dialog).getByRole("button", { name: "Supprimer le projet" }),
      );
      const confirmation = screen.getByRole("alertdialog");
      await user.click(
        within(confirmation).getByRole("button", {
          name: "Supprimer le projet",
        }),
      );
      await waitFor(() =>
        expect(
          within(confirmation).getByRole("button", {
            name: "Supprimer le projet",
          }),
        ).toBeEnabled(),
      );
      expect(router.replace).not.toHaveBeenCalled();
      if (status === 401)
        expect(
          within(confirmation).queryByRole("alert"),
        ).not.toBeInTheDocument();
      else
        expect(within(confirmation).getByRole("alert")).toHaveTextContent(
          status === 403
            ? "Vous n'avez pas l'autorisation"
            : "Impossible de supprimer",
        );
    },
  );
});
