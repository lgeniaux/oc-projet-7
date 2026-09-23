import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";

const backendFetch = vi.fn<typeof fetch>();
let serverError: ReturnType<typeof vi.spyOn>;

function loginRequest(
  body: unknown,
  origin = "http://localhost:3100",
): Request {
  return new Request("http://localhost:3100/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", backendFetch);
    serverError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    backendFetch.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    serverError.mockRestore();
  });

  it("places the backend token only in a protected cookie", async () => {
    backendFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: { token: "secret-jwt", user: { email: "a@example.com" } },
      }),
    );

    const response = await POST(
      loginRequest({ email: "a@example.com", password: "Password123!" }),
    );

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      new URL("http://localhost:3001/auth/login"),
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(await response.text()).not.toContain("secret-jwt");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("marks the session cookie Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    backendFetch.mockResolvedValue(
      Response.json({ success: true, data: { token: "secret-jwt" } }),
    );

    const response = await POST(
      loginRequest({ email: "a@example.com", password: "Password123!" }),
    );

    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("does not expose backend details for invalid credentials", async () => {
    backendFetch.mockResolvedValue(
      Response.json(
        {
          success: false,
          message: "sensitive detail",
          error: "INVALID_CREDENTIALS",
        },
        { status: 401 },
      ),
    );

    const response = await POST(
      loginRequest({ email: "a@example.com", password: "wrong" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "E-mail ou mot de passe incorrect.",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects requests from another origin before calling the backend", async () => {
    const response = await POST(
      loginRequest(
        { email: "a@example.com", password: "x" },
        "https://evil.example",
      ),
    );

    expect(response.status).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects missing credentials and an unavailable backend", async () => {
    const invalid = await POST(loginRequest({ email: "a@example.com" }));
    expect(invalid.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();

    backendFetch.mockRejectedValue(new Error("Connection refused"));
    const unavailable = await POST(
      loginRequest({ email: "a@example.com", password: "x" }),
    );
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).not.toContain("Connection refused");
    expect(JSON.stringify(serverError.mock.calls)).not.toContain(
      "Connection refused",
    );
  });

  it("rejects malformed backend payloads without logging a token", async () => {
    backendFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: { token: 123, password: "sensitive" },
      }),
    );

    const response = await POST(
      loginRequest({ email: "a@example.com", password: "Password123!" }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(serverError).toHaveBeenCalledWith(
      "Invalid auth backend payload, status:",
      200,
    );
    expect(JSON.stringify(serverError.mock.calls)).not.toContain("sensitive");
  });
});
