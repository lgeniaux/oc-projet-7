import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

test("an account owner updates their profile and password without losing their session", async ({
  page,
  request,
}) => {
  const id = randomUUID();
  const email = `account-${id}@example.com`;
  const updatedEmail = `updated-account-${id}@example.com`;
  const initialPassword = "AccountPassword123!";
  const newPassword = "ChangedPassword456!";
  const registration = await request.post(`${apiURL}/auth/register`, {
    data: { name: "Compte de test", email, password: initialPassword },
  });
  expect(registration.status()).toBe(201);
  expect(await registration.json()).toMatchObject({ success: true });

  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Mon compte" }).click();
  await expect(page).toHaveURL("/account");
  await expect(
    page.getByRole("heading", { name: "Mon compte", level: 1 }),
  ).toBeVisible();

  const name = page.getByRole("textbox", { name: "Nom", exact: true });
  const profileEmail = page.getByRole("textbox", {
    name: "E-mail",
    exact: true,
  });
  await expect(name).toHaveValue("Compte de test");
  await expect(profileEmail).toHaveValue(email);
  await name.fill("Compte modifié");
  await profileEmail.fill(updatedEmail);
  await page.getByRole("button", { name: "Modifier les informations" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Vos informations ont été mises à jour." }),
  ).toBeVisible();
  await expect(
    page.getByText("Bonjour Compte modifié", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu du compte" })).toHaveText(
    "CM",
  );

  await page.reload();
  await expect(page).toHaveURL("/account");
  await expect(name).toHaveValue("Compte modifié");
  await expect(profileEmail).toHaveValue(updatedEmail);

  const currentPassword = page.getByLabel("Mot de passe actuel", {
    exact: true,
  });
  const replacementPassword = page.getByLabel("Nouveau mot de passe", {
    exact: true,
  });
  await currentPassword.fill("WrongPassword123!");
  await replacementPassword.fill(newPassword);
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(
    page
      .getByRole("form", { name: "Mot de passe", exact: true })
      .getByRole("alert"),
  ).toContainText("Le mot de passe actuel est incorrect.");
  await expect(currentPassword).toBeFocused();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("navigation")).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("authToken") !== null),
  ).toBe(true);

  await currentPassword.fill(initialPassword);
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Votre mot de passe a été modifié." }),
  ).toBeVisible();
  await expect(currentPassword).toHaveValue("");
  await expect(replacementPassword).toHaveValue("");
  await expect(page).toHaveURL("/account");

  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/login");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill(updatedEmail);
  await page.getByLabel("Mot de passe", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "E-mail ou mot de passe incorrect." }),
  ).toContainText("E-mail ou mot de passe incorrect.");
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Mot de passe", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Mon compte" }).click();
  await expect(name).toHaveValue("Compte modifié");
  await expect(profileEmail).toHaveValue(updatedEmail);
});
