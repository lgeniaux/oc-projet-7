import { expect, test } from "@playwright/test";

test("creates an assigned task, changes its status and deletes it", async ({
  page,
}) => {
  const suffix = `${Date.now()}-${test.info().workerIndex}`;
  const projectName = `Projet tâches ${suffix}`;
  const taskTitle = `Tâche jetable ${suffix}`;
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("alice@example.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("P@ssword123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");

  // Use a disposable project: the seed data stays unchanged.
  await page.getByRole("link", { name: "Projets", exact: true }).click();
  await page
    .getByRole("button", { name: "Créer un projet", exact: true })
    .click();
  const projectCreation = page.getByRole("dialog", { name: "Créer un projet" });
  await projectCreation
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill(projectName);
  await projectCreation.getByRole("searchbox").fill("bob@example.com");
  await projectCreation
    .getByRole("button", { name: "Ajouter Bob Dupont", exact: true })
    .click();
  await projectCreation
    .getByRole("button", { name: "Ajouter un projet", exact: true })
    .click();
  await page.getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByText("Aucune tâche pour ce projet.")).toBeVisible();

  await page
    .getByRole("button", { name: "Créer une tâche", exact: true })
    .click();
  const creation = page.getByRole("dialog", { name: "Créer une tâche" });
  await creation
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill(taskTitle);
  await creation
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Vérifier le parcours des tâches.");
  await creation.getByLabel(/^Échéance/).fill("2026-03-09");
  await creation.getByRole("button", { name: /^Assigné à/ }).click();
  await page.getByRole("menuitemcheckbox", { name: /Bob Dupont/ }).click();
  await page.keyboard.press("Escape");
  await expect(creation.getByRole("button", { name: /^Assigné à/ })).toHaveText(
    /Bob Dupont/,
  );
  await creation.getByRole("radio", { name: "En cours", exact: true }).click();
  await creation
    .getByRole("button", { name: "Ajouter une tâche", exact: true })
    .click();

  await expect(creation).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    `Tâche « ${taskTitle} » créée.`,
  );
  const card = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { level: 3, name: taskTitle }) });
  await expect(card.getByText("En cours", { exact: true })).toBeVisible();
  await expect(card.getByText("9 mars 2026", { exact: true })).toBeVisible();
  await expect(
    card.getByRole("list", { name: "Personnes assignées" }),
  ).toHaveText(/Bob Dupont/);

  const actions = card.getByRole("button", {
    name: `Actions de la tâche « ${taskTitle} »`,
  });
  await actions.click();
  await page.getByRole("menuitem", { name: "Modifier", exact: true }).click();
  const editing = page.getByRole("dialog", { name: "Modifier une tâche" });
  await expect(
    editing.getByRole("radio", { name: "En cours", exact: true }),
  ).toBeChecked();
  await editing.getByRole("radio", { name: "Terminée", exact: true }).click();
  await editing
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(editing).not.toBeVisible();
  await expect(card.getByText("Terminée", { exact: true })).toBeVisible();
  await expect(actions).toBeFocused();

  await actions.click();
  await page.getByRole("menuitem", { name: "Supprimer", exact: true }).click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Supprimer cette tâche ?",
  });
  await expect(
    confirmation.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await confirmation
    .getByRole("button", { name: "Supprimer la tâche", exact: true })
    .click();
  await expect(
    page.getByText(`Tâche « ${taskTitle} » supprimée.`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: taskTitle }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 2, name: "Tâches", exact: true }),
  ).toBeFocused();

  // Remove the disposable project.
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("button", { name: "Supprimer le projet", exact: true })
    .click();
  await page
    .getByRole("alertdialog", { name: "Supprimer ce projet ?" })
    .getByRole("button", { name: "Supprimer le projet", exact: true })
    .click();
  await expect(page).toHaveURL("/projects");
});
