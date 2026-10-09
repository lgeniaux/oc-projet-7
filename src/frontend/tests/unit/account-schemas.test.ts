import { describe, expect, it } from "vitest";
import { passwordUpdateSchema, profileSchema } from "@/modules/account/schemas";
import { registerSchema } from "@/modules/auth/schemas";

describe("account profile fields", () => {
  it("trims names and permits an unchanged empty name", () => {
    expect(
      profileSchema.parse({
        name: "  Alice Martin  ",
        email: "alice@example.com",
      }),
    ).toEqual({ name: "Alice Martin", email: "alice@example.com" });
    expect(
      profileSchema.safeParse({ name: "", email: "alice@example.com" }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ name: "   ", email: "alice@example.com" })
        .success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ name: " A ", email: "alice@example.com" })
        .success,
    ).toBe(false);
  });

  it.each(["", "invalid", "alice @example.com"])(
    "rejects an invalid or missing e-mail: %s",
    (email) => {
      expect(profileSchema.safeParse({ name: "Alice", email }).success).toBe(
        false,
      );
    },
  );
});

describe("account password fields", () => {
  it("requires the current password without applying new-password strength rules", () => {
    expect(
      passwordUpdateSchema.safeParse({
        currentPassword: "x",
        newPassword: "NewPassword123!",
      }).success,
    ).toBe(true);
    expect(
      passwordUpdateSchema.safeParse({
        currentPassword: "",
        newPassword: "NewPassword123!",
      }).success,
    ).toBe(false);
  });

  it.each([
    "Password123!",
    "P@ssword123",
    "password123!",
    "PASSWORD123!",
    "Password!",
    "Pass1!",
    "Password123",
    "Password123#",
    "Password123! ",
    "",
  ])("shares registration strength rules for %j", (newPassword) => {
    const registration = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: newPassword,
    });
    const update = passwordUpdateSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword,
    });
    expect(update.success).toBe(registration.success);
  });

  it("rejects reusing the current password on the new-password field", () => {
    const result = passwordUpdateSchema.safeParse({
      currentPassword: "Password123!",
      newPassword: "Password123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["newPassword"] }),
        ]),
      );
    }
  });
});
