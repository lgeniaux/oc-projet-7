import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

for (const width of [375, 768, 1440]) {
  test(`login, navigation and sign-out at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    // This public fixture is documented in the unchanged backend README.
    await page.getByRole("textbox", { name: "E-mail" }).fill("alice@example.com");
    await page.getByLabel("Mot de passe").fill("P@ssword123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();

    for (const destination of [
      { link: "Projets", heading: "Mes projets", path: "/projects" },
      { link: "Mon compte", heading: "Mon compte", path: "/account" },
      { link: "Tableau de bord", heading: "Tableau de bord", path: "/" },
    ]) {
      const link = page.getByRole("link", { name: destination.link, exact: true });
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(destination.path);
      await expect(page.getByRole("heading", { level: 1, name: destination.heading })).toBeVisible();
      await expect(link).toHaveAttribute("aria-current", "page");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }

    await page.getByRole("link", { name: "Aller au contenu" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await page.getByRole("button", { name: /déconnecter/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/login");
    expect(await page.evaluate(() => sessionStorage.getItem("authToken") === null)).toBe(true);
    await page.goBack();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });
}

test("Express refuses the profile without a valid token", async ({ request }) => {
  for (const token of [undefined, "invalid-session"]) {
    const response = await request.get(`${apiURL}/auth/profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    expect(response.status()).toBe(401);
    const body: unknown = await response.json();
    expect(body).not.toHaveProperty("data.user");
  }
});

test("a real Express 401 explains the expired session", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => sessionStorage.setItem("authToken", "invalid-session"));
  await page.goto("/account");
  await expect(page).toHaveURL("/login?reason=session-expired");
  await expect(page.getByRole("status")).toContainText(/session.*expiré/i);
  expect(await page.evaluate(() => sessionStorage.getItem("authToken") === null)).toBe(true);
});

test("app pages redirect a visitor without a token", async ({ page }) => {
  for (const path of ["/", "/projects", "/account"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("navigation")).toHaveCount(0);
  }
});

test("an unknown route shows the Abricot 404", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: /introuvable/i })).toBeVisible();
  await expect(page.getByRole("img", { name: "Abricot" })).toBeVisible();
  await page.getByRole("link", { name: /Retour au tableau/ }).click();
  await expect(page).toHaveURL("/login");
});
