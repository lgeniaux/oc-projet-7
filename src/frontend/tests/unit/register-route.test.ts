import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";

const backendFetch = vi.fn<typeof fetch>();

function registerRequest(body: unknown, origin = "http://localhost:3100") {
  return new Request("http://localhost:3100/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

const validFields = {
  name: "Alice Dupont",
  email: "alice@example.com",
  password: "Password123!",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", backendFetch);
  });

  afterEach(() => {
    backendFetch.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("opens a session without exposing the JWT after registration", async () => {
    backendFetch.mockResolvedValue(
      Response.json(
        { success: true, data: { token: "private-jwt", user: { id: "1" } } },
        { status: 201 },
      ),
    );

    const response = await POST(
      registerRequest({ ...validFields, name: "  Alice Dupont  " }),
    );

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      new URL("http://localhost:3001/auth/register"),
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
      }),
    );
    const sentOptions = backendFetch.mock.calls[0][1];
    expect(JSON.parse(sentOptions?.body as string)).toEqual(validFields);
    expect(await response.text()).not.toContain("private-jwt");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("requires a name before contacting the backend", async () => {
    const response = await POST(
      registerRequest({
        email: validFields.email,
        password: validFields.password,
      }),
    );

    expect(response.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("reports an existing address without leaking the backend response", async () => {
    backendFetch.mockResolvedValue(
      Response.json({ message: "sensitive detail" }, { status: 409 }),
    );

    const response = await POST(registerRequest(validFields));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      message: "Cette adresse e-mail est déjà utilisée.",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("refuses a foreign origin and a malformed backend success", async () => {
    const forbidden = await POST(
      registerRequest(validFields, "https://evil.example"),
    );
    expect(forbidden.status).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();

    backendFetch.mockResolvedValue(
      Response.json({ success: true }, { status: 201 }),
    );
    const malformed = await POST(registerRequest(validFields));
    expect(malformed.status).toBe(503);
    expect(malformed.headers.get("set-cookie")).toBeNull();
  });
});
