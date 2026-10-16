import { expect, test } from "@playwright/test";

test("a signed-in user reads real project tasks and comments then returns to their list", async ({
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

  const projectHeading = page.getByRole("heading", {
    level: 2,
    name: /E-commerce/,
  });
  await expect(projectHeading).toBeVisible();
  const projectName = await projectHeading.innerText();
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

  const tasks = page.getByRole("region", { name: "Tâches", exact: true });
  await expect(
    tasks.getByRole("heading", { level: 2, name: "Tâches" }),
  ).toBeVisible();
  const databaseTask = tasks.getByRole("listitem").filter({
    has: page.getByRole("heading", {
      level: 3,
      name: "Conception de la base de données",
      exact: true,
    }),
  });
  await expect(
    databaseTask.getByText("Terminée", { exact: true }),
  ).toBeVisible();
  await expect(
    databaseTask.getByText("15 janvier 2024", { exact: true }),
  ).toBeVisible();
  const apiTask = tasks.getByRole("listitem").filter({
    has: page.getByRole("heading", {
      level: 3,
      name: "Développement de l'API REST",
      exact: true,
    }),
  });
  await expect(apiTask.getByText("En cours", { exact: true })).toBeVisible();
  const paymentTask = tasks.getByRole("listitem").filter({
    has: page.getByRole("heading", {
      level: 3,
      name: "Intégration système de paiement",
      exact: true,
    }),
  });
  await expect(paymentTask.getByText("À faire", { exact: true })).toBeVisible();

  const commentsTrigger = tasks
    .getByRole("button", { name: /^Commentaires \([1-9]\d*\)$/ })
    .first();
  await expect(commentsTrigger).toHaveAttribute("aria-expanded", "false");
  await commentsTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(commentsTrigger).toHaveAttribute("aria-expanded", "true");
  const comments = tasks.getByRole("list", {
    name: "Commentaires",
    exact: true,
  });
  await expect(comments).toBeVisible();
  const firstComment = comments.getByRole("listitem").first();
  await expect(firstComment.locator("time")).toHaveText(/\d{1,2} .+ \d{4}/);
  await expect(firstComment.locator("p")).not.toBeEmpty();
  await expect(firstComment.locator("span").first()).not.toBeEmpty();

  const backLink = page.getByRole("link", { name: "Mes projets", exact: true });
  await expect(backLink).toHaveAttribute("href", "/projects");
  await backLink.click();
  await expect(page).toHaveURL("/projects");
  await expect(
    page.getByRole("heading", { level: 2, name: projectName, exact: true }),
  ).toBeVisible();
});
