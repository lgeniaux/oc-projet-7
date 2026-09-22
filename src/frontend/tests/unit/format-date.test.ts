import { describe, expect, it } from "vitest";
import { formatFrenchDate } from "@/lib/format-date";

describe("formatFrenchDate", () => {
  it("affiche une date en français", () => {
    expect(formatFrenchDate(new Date(2026, 5, 12))).toBe("12 juin 2026");
  });
});
