import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/modules/auth/schemas";

describe("authentication fields", () => {
  it("accepts any non-empty password when signing in", () => {
    expect(
      loginSchema.safeParse({ email: "alice@example.com", password: "x" })
        .success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "alice@example.com", password: "" })
        .success,
    ).toBe(false);
  });

  it("requires a name and trims it for registration", () => {
    const result = registerSchema.safeParse({
      name: "  Alice  ",
      email: "alice@example.com",
      password: "Password123!",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Alice");
    expect(
      registerSchema.safeParse({
        email: "alice@example.com",
        password: "Password123!",
      }).success,
    ).toBe(false);
  });

  it("matches the backend password and email rules", () => {
    const fields = {
      name: "Alice",
      email: "alice@example.com",
      password: "Password123!",
    };
    expect(
      registerSchema.safeParse({ ...fields, password: "password123" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...fields, password: "Password123#" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...fields, email: "invalid" }).success,
    ).toBe(false);
  });
});
