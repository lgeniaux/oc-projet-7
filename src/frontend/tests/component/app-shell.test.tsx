import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";
import { AppShell } from "@/modules/auth/app-shell";
import { clearAuthToken } from "@/modules/auth/session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/projects",
}));

const apiFetch = vi.fn<typeof fetch>();

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  replace.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("app shell", () => {
  it("hides the page content and redirects without a tab token", async () => {
    vi.stubGlobal("fetch", apiFetch);
    render(
      <AppShell>
        <h1>Contenu de la page</h1>
      </AppShell>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("shows navigation with a token and clears it immediately on sign-out", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("authToken", "tab-token");
    vi.stubGlobal("fetch", apiFetch);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    apiFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: { user: { name: "Alice Martin", email: "alice@example.com" } },
      }),
    );
    render(
      <AppShell>
        <h1>Mes projets</h1>
      </AppShell>,
    );

    expect(
      await screen.findByRole("heading", { name: "Mes projets" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Projets" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("link", { name: "Mon compte" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tableau de bord" }),
    ).not.toHaveAttribute("aria-current");
    await screen.findByText(/Bonjour Alice Martin/);
    const headers = apiFetch.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer tab-token");

    const accountMenu = screen.getByRole("button", { name: "Menu du compte" });
    expect(accountMenu).toHaveTextContent("AM");
    await user.click(accountMenu);
    expect(
      await screen.findByRole("menuitem", { name: "Mon compte" }),
    ).toHaveAttribute("href", "/account");
    await user.click(screen.getByRole("menuitem", { name: "Se déconnecter" }));
    expect(sessionStorage.getItem("authToken")).toBeNull();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("clears a rejected token, redirects and explains expiration on login", async () => {
    sessionStorage.setItem("authToken", "expired-token");
    vi.stubGlobal("fetch", apiFetch);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    apiFetch.mockResolvedValue(new Response(null, { status: 401 }));
    const { unmount } = render(
      <AppShell>
        <h1>Contenu de la page</h1>
      </AppShell>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?reason=session-expired"),
    );
    expect(sessionStorage.getItem("authToken")).toBeNull();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    unmount();
    render(
      await LoginPage({
        searchParams: Promise.resolve({ reason: "session-expired" }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/session.*expiré/i);
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeVisible();
  });
});
