import { expect, test } from "@playwright/test";

test("edits contributors and project fields then confirms deletion without reloading", async ({
  page,
}) => {
  const name = `Projet administration ${Date.now()}-${test.info().workerIndex}`;
  const editedName = `${name} modifié`;
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("alice@example.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("P@ssword123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Projets", exact: true }).click();
  // The dashboard also has this button: wait for the projects page first.
  await expect(page).toHaveURL("/projects");
  await page
    .getByRole("button", { name: "Créer un projet", exact: true })
    .click();
  const creation = page.getByRole("dialog", { name: "Créer un projet" });
  await creation
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill(name);
  await creation
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Description à effacer.");
  await creation.getByRole("searchbox").fill("bob@example.com");
  await creation
    .getByRole("button", { name: "Ajouter Bob Dupont", exact: true })
    .click();
  await creation
    .getByRole("button", { name: "Ajouter un projet", exact: true })
    .click();
  await expect(creation).not.toBeVisible();
  await page.getByRole("link", { name, exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name, exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.editingJourney = "same-document";
  });
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  const editing = page.getByRole("dialog", { name: "Modifier un projet" });
  await expect(
    editing.getByRole("textbox", { name: "Titre", exact: true }),
  ).toHaveValue(name);
  await editing
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill(editedName);
  await editing
    .getByRole("textbox", { name: "Description", exact: true })
    .clear();
  await editing
    .getByRole("button", { name: "Retirer Bob Dupont", exact: true })
    .click();
  await editing.getByRole("searchbox").fill("caroline@example.com");
  await editing
    .getByRole("button", { name: "Ajouter Caroline Leroy", exact: true })
    .click();
  await editing
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(editing).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Projet modifié.");
  await expect(
    page.getByRole("heading", { level: 1, name: editedName, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucune description.", { exact: true }),
  ).toBeVisible();
  const contributors = page.getByRole("list", {
    name: "Contributeurs du projet",
  });
  await expect(contributors).toContainText("Caroline Leroy");
  await expect(contributors).not.toContainText("Bob Dupont");
  await expect(
    page.getByRole("button", { name: "Modifier", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.dataset.editingJourney),
  ).toBe("same-document");
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await editing
    .getByRole("button", { name: "Supprimer le projet", exact: true })
    .click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Supprimer ce projet ?",
  });
  await expect(
    confirmation.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await confirmation
    .getByRole("button", { name: "Supprimer le projet", exact: true })
    .click();
  await expect(page).toHaveURL("/projects");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mes projets" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: editedName, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Projet inaccessible", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.dataset.editingJourney),
  ).toBe("same-document");
});
