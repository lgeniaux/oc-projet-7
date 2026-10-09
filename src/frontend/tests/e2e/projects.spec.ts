import { expect, test } from "@playwright/test";

test("a signed-in user opens a real project and returns to their list", async ({
  page,
}) => {
  await page.goto("/login");
  // Use the public seed account without changing its projects or profile.
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("alice@example.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("P@ssword123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Projets", exact: true }).click();
  await expect(page).toHaveURL("/projects");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mes projets" }),
  ).toBeVisible();

  const projectHeading = page.getByRole("heading", { level: 2 }).first();
  await expect(projectHeading).toBeVisible();
  const projectName = await projectHeading.innerText();
  expect(projectName.trim()).not.toBe("");
  const projectLink = page.getByRole("link", {
    name: projectName,
    exact: true,
  });
  await expect(projectLink).toHaveAttribute("href", /^\/projects\/[^/]+$/);
  await projectLink.focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: projectName, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const backLink = page.getByRole("link", { name: "Mes projets", exact: true });
  await expect(backLink).toHaveAttribute("href", "/projects");
  await backLink.click();
  await expect(page).toHaveURL("/projects");
  await expect(
    page.getByRole("heading", { level: 2, name: projectName, exact: true }),
  ).toBeVisible();
});
