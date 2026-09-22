import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1440]) {
  test(`la présentation Abricot tient dans une largeur de ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("img", { name: "Abricot" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Vos projets/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Disponible prochainement" }),
    ).toBeDisabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
