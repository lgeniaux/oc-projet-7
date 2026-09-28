import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/modules/auth/login-form";
import { RegisterForm } from "@/modules/auth/register-form";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const apiFetch = vi.fn<typeof fetch>();

afterEach(() => {
  cleanup();
  apiFetch.mockReset();
  replace.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

describe("authentication forms", () => {
  it("shows a login error, then navigates after valid credentials", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", apiFetch);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    apiFetch
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({ success: true, data: { token: "login-token" } }),
      );
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "E-mail" }),
      "alice@example.com",
    );
    await user.type(screen.getByLabelText("Mot de passe"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou mot de passe incorrect.",
    );
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(sessionStorage.getItem("authToken")).toBe("login-token");
    expect(apiFetch).toHaveBeenCalledWith(
      new URL("http://localhost:8000/auth/login"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("validates registration before sending it and reports a duplicate e-mail", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", apiFetch);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    apiFetch
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(
        Response.json(
          { success: true, data: { token: "register-token" } },
          { status: 201 },
        ),
      );
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(apiFetch).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Nom" }),
      "Alice Dupont",
    );
    await user.type(
      screen.getByRole("textbox", { name: "E-mail" }),
      "alice@example.com",
    );
    await user.type(screen.getByLabelText("Mot de passe"), "Password123!");
    await user.click(screen.getByRole("button", { name: "S'inscrire" }));
    expect(
      await screen.findByText(/Cette adresse e-mail est déjà utilisée/),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith(
      new URL("http://localhost:8000/auth/register"),
      expect.objectContaining({ method: "POST" }),
    );

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(sessionStorage.getItem("authToken")).toBe("register-token");
  });
});
