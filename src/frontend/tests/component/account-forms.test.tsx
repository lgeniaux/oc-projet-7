import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDetails } from "@/modules/account/account-details";
import { PasswordForm } from "@/modules/account/password-form";
import { ProfileForm } from "@/modules/account/profile-form";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { AppShell } from "@/modules/auth/app-shell";
import { clearAuthToken } from "@/modules/auth/session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/account",
}));

const apiFetch = vi.fn<typeof fetch>();
const profile = {
  id: "alice",
  name: "Alice Martin",
  email: "alice@example.com",
};
const profileSuccess = "Vos informations ont été mises à jour.";
const passwordSuccess = "Votre mot de passe a été modifié.";

beforeEach(() => {
  sessionStorage.setItem("authToken", "account-token");
  vi.stubGlobal("fetch", apiFetch);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  apiFetch.mockReset();
  replace.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("account profile form", () => {
  it("shares one initial profile request and refreshes the shell identity after an update", async () => {
    const user = userEvent.setup();
    const updatedProfile = {
      id: profile.id,
      name: "Alice Dupont",
      email: "updated@example.com",
    };
    apiFetch
      .mockResolvedValueOnce(
        Response.json({ success: true, data: { user: profile } }),
      )
      .mockResolvedValueOnce(
        Response.json({ success: true, data: { user: updatedProfile } }),
      )
      .mockResolvedValueOnce(
        Response.json({ success: true, data: { user: updatedProfile } }),
      );
    render(
      <AppShell>
        <h1>Mon compte</h1>
        <AccountDetails />
      </AppShell>,
    );

    const name = await screen.findByRole("textbox", {
      name: "Nom",
    });
    const email = screen.getByRole("textbox", { name: "E-mail" });
    expect(name).toHaveValue(profile.name);
    expect(email).toHaveValue(profile.email);
    const accountMenu = screen.getByRole("button", { name: "Menu du compte" });
    await waitFor(() => expect(accountMenu).toHaveTextContent("AM"));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    await user.clear(name);
    await user.type(name, "  Alice Dupont  ");
    await user.clear(email);
    await user.type(email, updatedProfile.email);
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );

    expect(await screen.findByText(profileSuccess)).toHaveAttribute(
      "role",
      "status",
    );
    await waitFor(() => expect(accountMenu).toHaveTextContent("AD"));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      new URL("http://localhost:8000/auth/profile"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          name: updatedProfile.name,
          email: updatedProfile.email,
        }),
      }),
    );
    const headers = apiFetch.mock.calls[1][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer account-token");
    expect(name).toHaveValue(updatedProfile.name);
  });

  it("focuses the invalid e-mail, then the duplicate e-mail reported by Express", async () => {
    const user = userEvent.setup();
    apiFetch.mockResolvedValueOnce(
      Response.json(
        { success: false, error: "EMAIL_ALREADY_EXISTS" },
        { status: 409 },
      ),
    );
    render(
      <AppQueryProvider>
        <ProfileForm profile={profile} />
      </AppQueryProvider>,
    );
    const email = screen.getByRole("textbox", { name: "E-mail" });
    await user.clear(email);
    await user.type(email, "invalid");
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Adresse e-mail invalide.",
    );
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(apiFetch).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, "taken@example.com");
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cette adresse e-mail est déjà utilisée.",
    );
    expect(email).toHaveFocus();
    expect(sessionStorage.getItem("authToken")).toBe("account-token");
  });

  it("omits an unchanged nullable name instead of sending an invalid empty name", async () => {
    const user = userEvent.setup();
    const unnamedProfile = { id: profile.id, name: null, email: profile.email };
    apiFetch.mockResolvedValueOnce(
      Response.json({ success: true, data: { user: unnamedProfile } }),
    );
    render(
      <AppQueryProvider>
        <ProfileForm profile={unnamedProfile} />
      </AppQueryProvider>,
    );
    expect(screen.getByRole("textbox", { name: "Nom" })).toHaveValue("");
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    await screen.findByText(profileSuccess);
    expect(apiFetch).toHaveBeenCalledWith(
      new URL("http://localhost:8000/auth/profile"),
      expect.objectContaining({
        body: JSON.stringify({ email: profile.email }),
      }),
    );
  });

  it("does not silently clear an existing name that Express cannot clear", async () => {
    const user = userEvent.setup();
    render(
      <AppQueryProvider>
        <ProfileForm profile={profile} />
      </AppQueryProvider>,
    );
    const name = screen.getByRole("textbox", { name: "Nom" });
    await user.clear(name);
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/nom/i);
    expect(name).toHaveFocus();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("reports a network failure in French without losing entered values", async () => {
    const user = userEvent.setup();
    apiFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(
      <AppQueryProvider>
        <ProfileForm profile={profile} />
      </AppQueryProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La modification de vos informations est indisponible. Réessayez plus tard.",
    );
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveValue(
      profile.email,
    );
    expect(sessionStorage.getItem("authToken")).toBe("account-token");
    expect(screen.queryByText(profileSuccess)).not.toBeInTheDocument();
  });

  it("maps an Express validation error onto the e-mail field without displaying raw text", async () => {
    const user = userEvent.setup();
    apiFetch.mockResolvedValueOnce(
      Response.json(
        {
          success: false,
          message: "Raw backend message",
          error: "Validation failed",
          data: {
            errors: [{ field: "email", message: "Raw validation detail" }],
          },
        },
        { status: 400 },
      ),
    );
    render(
      <AppQueryProvider>
        <ProfileForm profile={profile} />
      </AppQueryProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/e-mail/i);
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveFocus();
    expect(screen.queryByText(/Raw/)).not.toBeInTheDocument();
  });
});

describe("account password form", () => {
  it("validates required fields before calling Express", async () => {
    const user = userEvent.setup();
    render(
      <AppQueryProvider>
        <PasswordForm />
      </AppQueryProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: "Modifier le mot de passe" }),
    );
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(
      screen.getByLabelText("Mot de passe actuel", { exact: true }),
    ).toHaveFocus();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("keeps the session on a wrong current password and clears both fields after success", async () => {
    const user = userEvent.setup();
    apiFetch
      .mockResolvedValueOnce(
        Response.json(
          { success: false, error: "INVALID_CURRENT_PASSWORD" },
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));
    render(
      <AppQueryProvider>
        <PasswordForm />
      </AppQueryProvider>,
    );
    const currentPassword = screen.getByLabelText("Mot de passe actuel", {
      exact: true,
    });
    const newPassword = screen.getByLabelText("Nouveau mot de passe", {
      exact: true,
    });
    await user.type(currentPassword, "WrongPassword123!");
    await user.type(newPassword, "NewPassword123!");
    await user.click(
      screen.getByRole("button", { name: "Modifier le mot de passe" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le mot de passe actuel est incorrect.",
    );
    expect(currentPassword).toHaveFocus();
    expect(currentPassword).toHaveValue("WrongPassword123!");
    expect(newPassword).toHaveValue("NewPassword123!");
    expect(sessionStorage.getItem("authToken")).toBe("account-token");
    expect(replace).not.toHaveBeenCalled();

    await user.clear(currentPassword);
    await user.type(currentPassword, "OldPassword123!");
    await user.click(
      screen.getByRole("button", { name: "Modifier le mot de passe" }),
    );
    expect(await screen.findByText(passwordSuccess)).toHaveAttribute(
      "role",
      "status",
    );
    expect(currentPassword).toHaveValue("");
    expect(newPassword).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenLastCalledWith(
      new URL("http://localhost:8000/auth/password"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        }),
      }),
    );
  });

  it("keeps each form's pending and success status independent", async () => {
    const user = userEvent.setup();
    let resolveProfile!: (response: Response) => void;
    apiFetch
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveProfile = resolve;
          }),
      )
      .mockResolvedValueOnce(Response.json({ success: true }));
    render(
      <AppQueryProvider>
        <ProfileForm profile={profile} />
        <PasswordForm />
      </AppQueryProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: "Modifier les informations" }),
    );
    expect(
      await screen.findByRole("button", { name: "Enregistrement en cours…" }),
    ).toBeDisabled();
    const passwordButton = screen.getByRole("button", {
      name: "Modifier le mot de passe",
    });
    expect(passwordButton).toBeEnabled();
    await user.type(
      screen.getByLabelText("Mot de passe actuel", { exact: true }),
      "OldPassword123!",
    );
    await user.type(
      screen.getByLabelText("Nouveau mot de passe", { exact: true }),
      "NewPassword123!",
    );
    await user.click(passwordButton);
    await screen.findByText(passwordSuccess);
    expect(screen.queryByText(profileSuccess)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enregistrement en cours…" }),
    ).toBeDisabled();

    await act(async () => {
      resolveProfile(Response.json({ success: true, data: { user: profile } }));
    });
    await screen.findByText(profileSuccess);
    expect(screen.getByText(passwordSuccess)).toBeInTheDocument();
  });

  it.each(["network", "validation"])(
    "shows a French %s failure without clearing passwords",
    async (failure) => {
      const user = userEvent.setup();
      if (failure === "network") {
        apiFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      } else {
        apiFetch.mockResolvedValueOnce(
          Response.json(
            {
              success: false,
              error: "Validation failed",
              data: {
                errors: [
                  { field: "newPassword", message: "Raw backend detail" },
                ],
              },
            },
            { status: 400 },
          ),
        );
      }
      render(
        <AppQueryProvider>
          <PasswordForm />
        </AppQueryProvider>,
      );
      const currentPassword = screen.getByLabelText("Mot de passe actuel", {
        exact: true,
      });
      const newPassword = screen.getByLabelText("Nouveau mot de passe", {
        exact: true,
      });
      await user.type(currentPassword, "OldPassword123!");
      await user.type(newPassword, "NewPassword123!");
      await user.click(
        screen.getByRole("button", { name: "Modifier le mot de passe" }),
      );
      const alert = await screen.findByRole("alert");
      if (failure === "network") {
        expect(alert).toHaveTextContent(
          "La modification du mot de passe est indisponible. Réessayez plus tard.",
        );
      } else {
        expect(alert).toHaveTextContent(/mot de passe/i);
        expect(newPassword).toHaveFocus();
      }
      expect(screen.queryByText(/Raw backend/)).not.toBeInTheDocument();
      expect(currentPassword).toHaveValue("OldPassword123!");
      expect(newPassword).toHaveValue("NewPassword123!");
      expect(screen.queryByText(passwordSuccess)).not.toBeInTheDocument();
    },
  );
});

describe("account details", () => {
  it("shows loading until the real profile arrives", async () => {
    let resolveProfile!: (response: Response) => void;
    apiFetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveProfile = resolve;
        }),
    );
    render(
      <AppQueryProvider>
        <AccountDetails />
      </AppQueryProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement de vos informations…",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await act(async () => {
      resolveProfile(Response.json({ success: true, data: { user: profile } }));
    });
    expect(await screen.findByRole("textbox", { name: "Nom" })).toHaveValue(
      profile.name,
    );
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveValue(
      profile.email,
    );
  });

  it("shows a profile failure and retries without losing the session", async () => {
    const user = userEvent.setup();
    apiFetch
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({ success: true, data: { user: profile } }),
      );
    render(
      <AppQueryProvider>
        <AccountDetails />
      </AppQueryProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Vos informations sont indisponibles. Réessayez.",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("authToken")).toBe("account-token");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByRole("textbox", { name: "E-mail" })).toHaveValue(
      profile.email,
    );
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  });
});
