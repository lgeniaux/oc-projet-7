import { expect, test } from "@playwright/test";

test("creates a project with a searched contributor and opens it without reloading", async ({
  page,
}) => {
  const name = `Projet création ${Date.now()}-${test.info().workerIndex}`;
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("alice@example.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("P@ssword123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Projets", exact: true }).click();
  await page
    .getByRole("button", { name: "Créer un projet", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Créer un projet" });
  await dialog.getByRole("textbox", { name: "Titre", exact: true }).fill(name);
  await dialog
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Projet créé par le parcours E2E.");
  await dialog
    .getByRole("searchbox", {
      name: "Rechercher un contributeur par e-mail ou nom",
    })
    .fill("bob@example.com");
  await dialog
    .getByRole("button", { name: "Ajouter Bob Dupont", exact: true })
    .click();
  await expect(
    dialog.getByRole("list", { name: "Contributeurs sélectionnés" }),
  ).toContainText("bob@example.com");
  await dialog
    .getByRole("button", { name: "Ajouter un projet", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText(`Projet « ${name} » créé.`, { exact: true }),
  ).toBeVisible();
  const link = page.getByRole("link", { name, exact: true });
  await expect(link).toBeVisible();
  await expect(
    link.getByRole("img", { name: "Bob Dupont, Contributeur", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer un projet", exact: true }),
  ).toBeFocused();
  await link.click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name, exact: true }),
  ).toBeVisible();
});
