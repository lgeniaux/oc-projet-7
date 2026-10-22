import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatFrenchCalendarDate,
  formatFrenchDate,
  toCalendarDateTime,
} from "@/lib/format-date";

describe("formatFrenchDate", () => {
  it("affiche une date en français", () => {
    expect(formatFrenchDate(new Date(2026, 5, 12))).toBe("12 juin 2026");
  });
});

describe("formatFrenchCalendarDate", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["America/Los_Angeles", "Pacific/Kiritimati"])(
    "keeps a midnight UTC deadline unchanged in %s",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);
      expect(formatFrenchCalendarDate("2026-03-09T00:00:00.000Z")).toBe(
        "9 mars 2026",
      );
    },
  );

  it.each([
    ["2024-03-09T00:00:00.000Z", "9 mars 2024"],
    ["2026-12-31T23:30:00.000Z", "31 décembre 2026"],
    ["2026-01-01T00:30:00+14:00", "1 janvier 2026"],
  ])("preserves the API calendar day for %s", (value, expected) => {
    expect(formatFrenchCalendarDate(value)).toBe(expected);
  });
});

describe("toCalendarDateTime", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["America/Los_Angeles", "Pacific/Kiritimati"])(
    "sends the chosen day at the year boundary in %s",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);
      const value = toCalendarDateTime("2026-12-31");
      expect(new Date(value).toISOString()).toBe("2026-12-31T00:00:00.000Z");
      expect(formatFrenchCalendarDate(value)).toBe("31 décembre 2026");
    },
  );
});
